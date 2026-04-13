import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { callLLM } from "@/lib/llm/client";

// LLM proxy endpoint for client-side components
export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { prompt, systemPrompt } = body;

  if (!prompt || !systemPrompt) {
    return NextResponse.json({ error: "prompt and systemPrompt are required" }, { status: 400 });
  }

  try {
    const response = await callLLM(prompt, systemPrompt);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("LLM error:", error);
    return NextResponse.json({ error: "LLM request failed" }, { status: 500 });
  }
}
