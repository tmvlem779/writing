import { createHash } from "node:crypto";
import OpenAI from "openai";

export function createSafetyIdentifier(userId: string): string {
  const salt = process.env.SAFETY_IDENTIFIER_SALT;
  const isProduction = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  if (!salt && isProduction) throw new Error("SAFETY_IDENTIFIER_SALT_REQUIRED");
  return createHash("sha256").update(`${salt ?? "development-only"}:${userId}`).digest("hex").slice(0, 64);
}

export async function moderateText(client: OpenAI, input: string) {
  const result = await client.moderations.create({
    model: "omni-moderation-latest",
    input
  });
  const first = result.results[0];
  return {
    flagged: first?.flagged ?? false,
    categories: first ? Object.entries(first.categories).filter(([, value]) => value).map(([key]) => key) : []
  };
}
