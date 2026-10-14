export function resolveOpenAiModel(value = process.env.OPENAI_MODEL): string {
  return value?.trim() || "gpt-5-mini";
}

export function resolveUpstageModel(value = process.env.UPSTAGE_MODEL): string {
  return value?.trim() || "solar-mini4";
}
