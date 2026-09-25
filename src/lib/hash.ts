import { createHash } from "node:crypto";

/** SHA-256 of a string or JSON-serializable value, used for evidence integrity. */
export function sha256(value: unknown): string {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(payload).digest("hex");
}
