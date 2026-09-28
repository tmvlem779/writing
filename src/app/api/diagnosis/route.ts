import { NextResponse } from "next/server";
import { z } from "zod";
import { grammarDiagnosticQuestions, scoreDiagnosticAnswers } from "@/lib/diagnosis/grammar-diagnostic";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  answers: z.record(z.string().max(80), z.string().max(20))
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "진단 결과 형식이 올바르지 않습니다." }, { status: 400 });

  const hasEveryQuestion = grammarDiagnosticQuestions.every((question) => question.id in parsed.data.answers);
  if (!hasEveryQuestion) return NextResponse.json({ error: "모든 진단 문항을 먼저 완료해 주세요." }, { status: 400 });

  const score = scoreDiagnosticAnswers(parsed.data.answers);
  const domains = [...new Set(grammarDiagnosticQuestions.map((question) => question.domain))].map((domain) => {
    const questions = grammarDiagnosticQuestions.filter((question) => question.domain === domain);
    return {
      domain,
      correct: questions.filter((question) => parsed.data.answers[question.id] === question.answer).length,
      total: questions.length
    };
  });

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (process.env.APP_ENV === "production") return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ demo: true, score, domains });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    if (process.env.APP_ENV !== "production") return NextResponse.json({ demo: true, score, domains });
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("class_memberships")
    .select("class_id")
    .eq("user_id", auth.user.id)
    .eq("role", "student")
    .in("status", ["invited", "active"])
    .limit(1)
    .maybeSingle();

  const { data: session, error: sessionError } = await supabase
    .from("learning_sessions")
    .insert({ user_id: auth.user.id, class_id: membership?.class_id ?? null, activity_type: "diagnose", status: "completed" })
    .select("id")
    .single();
  if (sessionError || !session) return NextResponse.json({ error: "진단 결과를 저장하지 못했습니다." }, { status: 500 });

  const { error: eventError } = await supabase.from("learning_events").insert({
    session_id: session.id,
    user_id: auth.user.id,
    event_type: "diagnostic_completed",
    concept_code: "diagnose",
    metadata: { score, total: grammarDiagnosticQuestions.length, domains }
  });
  if (eventError) return NextResponse.json({ error: "진단 세부 결과를 저장하지 못했습니다." }, { status: 500 });

  return NextResponse.json({ score, domains });
}
