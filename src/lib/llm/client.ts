// Configurable LLM provider — default Anthropic Claude
// Spec §4.A, §4.E, §4.G — assistive use only, all outputs require human approval
import Anthropic from "@anthropic-ai/sdk";

export type LLMProvider = "anthropic";

const MODEL = "claude-opus-5";

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

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

  // Server-side refusal fallback: if the primary model declines, the API retries
  // the same request on a fallback model within the same call.
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: options?.maxTokens ?? 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }

  return response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
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
