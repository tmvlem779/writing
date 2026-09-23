import OpenAI from "openai";
import { NextResponse } from "next/server";
import { assertBudgetAvailable, assertDailyTurnLimit, assertSessionTurnLimit, estimateTurnCostUsd } from "@/lib/agent/budget";
import { buildFallbackResponse } from "@/lib/agent/fallback";
import { deriveLearningEvidence } from "@/lib/agent/learning-evidence";
import { runOpenAiAgent } from "@/lib/agent/openai-agent";
import { turnRequestSchema } from "@/lib/agent/schema";
import { PROMPT_VERSION } from "@/lib/agent/system-prompt";
import { createSafetyIdentifier, moderateText } from "@/lib/safety/moderation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = turnRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "입력 형식을 확인해 주세요." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isProduction = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProduction && !auth.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = auth.user?.id ?? `demo:${parsed.data.sessionId}`;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (isProduction) return NextResponse.json({ error: "AI 서비스 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ ...buildFallbackResponse(parsed.data), demo: true });
  }
  if (isProduction && !process.env.SAFETY_IDENTIFIER_SALT) {
    return NextResponse.json({ error: "안전 식별자 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const admin = createAdminSupabaseClient();
  if (isProduction && !admin) {
    return NextResponse.json({ error: "사용량 보호 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  if (admin && auth.user) {
    const { data: ownedSession } = await admin
      .from("learning_sessions")
      .select("id")
      .eq("id", parsed.data.sessionId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!ownedSession) return NextResponse.json({ error: "학습 세션에 접근할 수 없습니다." }, { status: 403 });
  }

  try {
    await assertBudgetAvailable(admin);
    if (auth.user) {
      await assertDailyTurnLimit(admin, auth.user.id);
      await assertSessionTurnLimit(admin, parsed.data.sessionId);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "MONTHLY_BUDGET_EXCEEDED") {
      return NextResponse.json({ error: "이번 달 AI 사용 한도에 도달했습니다. 교사에게 알려 주세요." }, { status: 429 });
    }
    if (error instanceof Error && error.message === "DAILY_TURN_LIMIT_EXCEEDED") {
      return NextResponse.json({ error: "오늘 사용할 수 있는 AI 학습 횟수에 도달했습니다." }, { status: 429 });
    }
    if (error instanceof Error && error.message === "SESSION_TURN_LIMIT_EXCEEDED") {
      return NextResponse.json({ error: "이 학습에서 사용할 수 있는 AI 횟수에 도달했습니다. 새 학습을 시작해 주세요." }, { status: 429 });
    }
    return NextResponse.json({ error: "사용량을 확인할 수 없습니다." }, { status: 503 });
  }

  const client = new OpenAI({ apiKey });
  const startedAt = Date.now();
  const safetyIdentifier = createSafetyIdentifier(userId);

  try {
    const inputSafety = await moderateText(client, parsed.data.message);
    if (inputSafety.flagged) {
      await admin?.from("safety_events").insert({
        user_id: auth.user?.id ?? null,
        session_id: parsed.data.sessionId.startsWith("demo-") ? null : parsed.data.sessionId,
        category: inputSafety.categories.join(",") || "flagged_input",
        action: "blocked"
      });
      return NextResponse.json({
        mode: "question",
        scaffoldLevel: parsed.data.scaffoldLevel,
        studentMessage: "이 요청에는 지금 바로 답하기 어려운 내용이 포함되어 있어요. 안전한 학습 주제로 바꾸거나 교사에게 도움을 요청해 주세요.",
        question: "문장의 구조와 확장에 관한 다른 문장으로 다시 시도해 볼까요?",
        focusConcepts: [],
        observations: [],
        nextAction: "rewrite",
        masteryEvidence: [],
        safety: { blocked: true, reason: "입력 안전 검사" }
      });
    }

    const result = await runOpenAiAgent(client, parsed.data, safetyIdentifier);
    const outputSafety = await moderateText(client, `${result.response.studentMessage}\n${result.response.question}`);
    if (outputSafety.flagged) {
      return NextResponse.json({ error: "안전 검사를 통과하지 못해 응답을 표시하지 않았습니다." }, { status: 422 });
    }

    const cost = estimateTurnCostUsd(result.usage.input, result.usage.output);
    if (admin && auth.user) {
      const evidence = deriveLearningEvidence(parsed.data.activity, result.response);
      const { error: recordError } = await admin.rpc("record_learning_turn", {
        target_user_id: auth.user.id,
        target_session_id: parsed.data.sessionId,
        target_activity: parsed.data.activity,
        student_content: parsed.data.message,
        assistant_content: result.response.studentMessage,
        assistant_response: result.response,
        target_prompt_version: PROMPT_VERSION,
        target_model: result.model,
        target_input_tokens: result.usage.input,
        target_output_tokens: result.usage.output,
        target_cost_estimate_usd: cost,
        target_latency_ms: Date.now() - startedAt,
        target_concept_code: evidence.conceptCode,
        target_scaffold_level: evidence.scaffoldLevel,
        target_event_type: evidence.eventType,
        target_independent_success: evidence.independentSuccess
      });
      if (recordError) throw recordError;
    }
    return NextResponse.json(result.response);
  } catch (error) {
    console.error("agent_turn_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "AI 응답을 만드는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
