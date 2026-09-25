"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, getDbUserId } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { clearWorkspace, generateDemoData } from "@/lib/demo/generate";
import type { ActionResult } from "@/types";

// ---------------------------------------------------------------------------
// Server action entry point
// ---------------------------------------------------------------------------

export async function seedDemoData(): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    const reviewerId = await getDbUserId();
    await clearWorkspace(ctx.orgId);
    await generateDemoData(ctx.orgId, reviewerId, ctx.userEmail);
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to seed demo data:", error);
    await recordAudit({ tableName: "Organization", recordId: "sample-data", action: "SAMPLE_DATA_FAILED" });
    return { success: false, error: "The sample portfolio could not be loaded. Please try again." };
  }
}
