"use server";

// Spec §4.A — Policy Configuration Engine Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CreatePolicySchema, type CreatePolicyInput } from "@/lib/validators/policy";
import { callLLMJson } from "@/lib/llm/client";
import { POLICY_PARSER_SYSTEM, buildPolicyParserPrompt } from "@/lib/llm/prompts";
import type { ParsedPolicyRule } from "@/lib/llm/types";
import type { ActionResult } from "@/types";

export async function createPolicy(input: CreatePolicyInput): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();
  const parsed = CreatePolicySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const { propertyId, name, jurisdictionId, rules } = parsed.data;

  // Get latest version for this property
  const latest = await prisma.screeningPolicy.findFirst({
    where: { organizationId: orgId, propertyId },
    orderBy: { version: "desc" },
  });

  const policy = await prisma.screeningPolicy.create({
    data: {
      organizationId: orgId,
      propertyId,
      name,
      version: (latest?.version ?? 0) + 1,
      jurisdictionId,
      rules: {
        create: rules.map((rule, idx) => ({
          ...rule,
          sortOrder: idx,
          lookbackMonths: rule.lookbackMonths ?? null,
          waiverConditions: rule.waiverConditions ?? null,
        })),
      },
    },
  });

  revalidatePath(`/dashboard/properties/${propertyId}/policy`);
  return { success: true, data: { id: policy.id } };
}

export async function publishPolicy(policyId: string): Promise<ActionResult> {
  const { orgId } = await getAuthContext();

  const policy = await prisma.screeningPolicy.findFirstOrThrow({
    where: { id: policyId, organizationId: orgId },
  });

  // Deactivate all other policies for this property
  await prisma.screeningPolicy.updateMany({
    where: { organizationId: orgId, propertyId: policy.propertyId, isActive: true },
    data: { isActive: false },
  });

  // Activate this one
  await prisma.screeningPolicy.update({
    where: { id: policyId },
    data: { isActive: true, publishedAt: new Date() },
  });

  revalidatePath(`/dashboard/properties/${policy.propertyId}/policy`);
  return { success: true };
}

export async function getPoliciesForProperty(propertyId: string) {
  const { orgId } = await getAuthContext();
  return prisma.screeningPolicy.findMany({
    where: { organizationId: orgId, propertyId },
    include: { rules: { orderBy: { sortOrder: "asc" } } },
    orderBy: { version: "desc" },
  });
}

// §4.A — LLM Use Case 1: Natural language policy parser
export async function parseNaturalLanguagePolicy(
  policyText: string
): Promise<ActionResult<ParsedPolicyRule[]>> {
  try {
    const rules = await callLLMJson<ParsedPolicyRule[]>(
      buildPolicyParserPrompt(policyText),
      POLICY_PARSER_SYSTEM
    );
    return { success: true, data: Array.isArray(rules) ? rules : [] };
  } catch (error) {
    return { success: false, error: `Failed to parse policy: ${error}` };
  }
}
