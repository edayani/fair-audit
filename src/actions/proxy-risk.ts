"use server";

// Spec §4.E — Proxy-Risk & Feature Governance Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { evaluateFeatureBatch, checkInteractionEffects } from "@/lib/engines/proxy-risk";
import { callLLMJson } from "@/lib/llm/client";
import { PROXY_FLAGGER_SYSTEM, buildProxyFlaggerPrompt } from "@/lib/llm/prompts";
import type { LLMProxyAnalysis } from "@/lib/llm/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getFeatureRegistry() {
  const { orgId } = await getAuthContext();
  return prisma.featureRegistry.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function registerFeature(data: {
  name: string;
  displayName: string;
  description?: string;
  dataType: string;
  source: string;
}): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const feature = await prisma.featureRegistry.create({
    data: { ...data, organizationId: orgId },
  });

  revalidatePath("/dashboard/features");
  return { success: true, data: { id: feature.id } };
}

export async function runProxyDetection(): Promise<ActionResult<{ flagged: number }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const features = await prisma.featureRegistry.findMany({
    where: { organizationId: orgId, isActive: true },
  });

  const results = evaluateFeatureBatch(features.map((f) => f.name));
  const interaction = checkInteractionEffects(features.map((f) => f.name));

  let flagged = 0;
  for (let i = 0; i < features.length; i++) {
    const result = results[i];
    await prisma.featureRegistry.update({
      where: { id: features[i].id },
      data: {
        proxyRiskScore: result.riskScore,
        flaggedAsProxy: result.isProxy,
        proxyFor: result.proxyFor,
        proxyExplanation: result.explanation +
          (interaction.detected ? `\n\nINTERACTION WARNING: ${interaction.warning}` : ""),
      },
    });
    if (result.isProxy) flagged++;
  }

  revalidatePath("/dashboard/features");
  return { success: true, data: { flagged } };
}

// §4.E — LLM Use Case 3: Proxy risk flagging with human approval
export async function llmProxyAnalysis(): Promise<ActionResult<LLMProxyAnalysis>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const features = await prisma.featureRegistry.findMany({
    where: { organizationId: orgId, isActive: true },
  });

  const featureList = features.map((f) => `- ${f.displayName} (${f.name}): ${f.description ?? "No description"}, source: ${f.source}`).join("\n");

  try {
    const analysis = await callLLMJson<LLMProxyAnalysis>(
      buildProxyFlaggerPrompt(featureList),
      PROXY_FLAGGER_SYSTEM
    );

    // Mark as LLM-flagged but NOT approved (requires human review)
    for (const result of analysis.features ?? []) {
      const feature = features.find((f) => f.name === result.featureName);
      if (feature && result.isProxy) {
        await prisma.featureRegistry.update({
          where: { id: feature.id },
          data: { isLLMFlagged: true, llmApproved: false },
        });
      }
    }

    return { success: true, data: analysis };
  } catch (error) {
    return { success: false, error: `LLM analysis failed: ${error}` };
  }
}
