export function resolveOpenAiModel(value = process.env.OPENAI_MODEL): string {
  return value?.trim() || "gpt-5.6-luna";
}
