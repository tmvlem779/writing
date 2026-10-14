import OpenAI from "openai";
import { resolveOpenAiModel, resolveUpstageModel } from "./model.ts";

export type TutorProvider = "openai" | "upstage";

export type TutorProviderConfig = {
  provider: TutorProvider;
  apiKey: string;
  model: string;
  baseURL?: string;
};

const UPSTAGE_BASE_URL = "https://api.upstage.ai/v1";

export function resolveTutorProvider(
  env: Record<string, string | undefined> = process.env
): TutorProviderConfig {
  const requestedProvider = env.AI_PROVIDER?.trim().toLowerCase() || "auto";
  if (!["auto", "openai", "upstage"].includes(requestedProvider)) {
    throw new Error("INVALID_AI_PROVIDER");
  }

  const upstageApiKey = env.UPSTAGE_API_KEY?.trim();
  const useUpstage = requestedProvider === "upstage" || (requestedProvider === "auto" && Boolean(upstageApiKey));

  if (useUpstage) {
    if (!upstageApiKey) throw new Error("MISSING_UPSTAGE_API_KEY");
    return {
      provider: "upstage",
      apiKey: upstageApiKey,
      baseURL: UPSTAGE_BASE_URL,
      model: resolveUpstageModel(env.UPSTAGE_MODEL)
    };
  }

  const openAiApiKey = env.OPENAI_API_KEY?.trim();
  if (!openAiApiKey) throw new Error("MISSING_OPENAI_API_KEY");
  return {
    provider: "openai",
    apiKey: openAiApiKey,
    model: resolveOpenAiModel(env.OPENAI_MODEL)
  };
}

export function createTutorClient(config: TutorProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {})
  });
}
