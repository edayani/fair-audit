// Configurable LLM provider — default Anthropic Claude
// Spec §4.A, §4.E, §4.G — assistive use only, all outputs require human approval
import Anthropic from "@anthropic-ai/sdk";

export type LLMProvider = "anthropic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

/**
 * Call the LLM with a system prompt and user message.
 * Returns raw text response.
 */
export async function callLLM(
  userPrompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number }
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return a mock response in development without API key
    return JSON.stringify({
      note: "LLM API key not configured. This is a mock response.",
      input: userPrompt.slice(0, 100),
    });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: options?.maxTokens ?? 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Call LLM expecting a JSON response.
 */
export async function callLLMJson<T>(
  userPrompt: string,
  systemPrompt: string
): Promise<T> {
  const response = await callLLM(
    userPrompt,
    systemPrompt + "\n\nRespond with valid JSON only. No markdown, no explanation."
  );

  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("LLM did not return valid JSON");
  }

  return JSON.parse(jsonMatch[0]) as T;
}
