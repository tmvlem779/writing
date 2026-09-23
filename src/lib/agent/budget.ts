import type { SupabaseClient } from "@supabase/supabase-js";

const INPUT_USD_PER_MILLION = 0.1;
const OUTPUT_USD_PER_MILLION = 0.5;

export function estimateTurnCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * INPUT_USD_PER_MILLION + (outputTokens / 1_000_000) * OUTPUT_USD_PER_MILLION;
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
