import type { SupabaseClient } from "@supabase/supabase-js";

type TokenPricing = { input: number; output: number };

const TOKEN_PRICING_USD_PER_MILLION: Record<string, TokenPricing> = {
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 }
};

// 알 수 없는 모델은 비용을 낮게 잡지 않도록 보수적인 상한 단가로 계산한다.
const CONSERVATIVE_FALLBACK_PRICING: TokenPricing = { input: 10, output: 50 };

export function getTokenPricingUsdPerMillion(model: string): TokenPricing {
  const normalizedModel = model.trim();
  const exact = TOKEN_PRICING_USD_PER_MILLION[normalizedModel];
  if (exact) return exact;
  const family = Object.keys(TOKEN_PRICING_USD_PER_MILLION).find((name) => normalizedModel.startsWith(`${name}-`));
  return family ? TOKEN_PRICING_USD_PER_MILLION[family] : CONSERVATIVE_FALLBACK_PRICING;
}

export function estimateTurnCostUsd(
  inputTokens: number,
  outputTokens: number,
  model = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna"
): number {
  const pricing = getTokenPricingUsdPerMillion(model);
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export async function getMonthlySpendUsd(admin: SupabaseClient | null): Promise<number> {
  if (!admin) return 0;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data, error } = await admin
    .from("api_usage")
    .select("cost_estimate_usd")
    .gte("created_at", monthStart.toISOString());
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.cost_estimate_usd ?? 0), 0);
}

export async function assertBudgetAvailable(admin: SupabaseClient | null) {
  const limit = Number(process.env.MONTHLY_OPENAI_BUDGET_USD ?? 6);
  const spent = await getMonthlySpendUsd(admin);
  if (spent >= limit) {
    throw new Error("MONTHLY_BUDGET_EXCEEDED");
  }
  return { spent, limit };
}

export async function assertDailyTurnLimit(admin: SupabaseClient | null, userId: string) {
  if (!admin) return;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const limit = Number(process.env.DAILY_TURN_LIMIT_PER_USER ?? 40);
  const { count, error } = await admin
    .from("api_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .eq("status", "ok");
  if (error) throw error;
  if ((count ?? 0) >= limit) throw new Error("DAILY_TURN_LIMIT_EXCEEDED");
}

export async function assertSessionTurnLimit(admin: SupabaseClient | null, sessionId: string) {
  if (!admin) return;
  const limit = Number(process.env.MAX_TURNS_PER_SESSION ?? 30);
  const { count, error } = await admin
    .from("api_usage")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "ok");
  if (error) throw error;
  if ((count ?? 0) >= limit) throw new Error("SESSION_TURN_LIMIT_EXCEEDED");
}
