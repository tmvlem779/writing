import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const sourceSchema = z.enum(["diagnosis", "challenge", "self-study"]);
const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("record"),
    source: sourceSchema,
    sourceLabel: z.string().trim().min(1).max(40),
    problemId: z.string().trim().min(1).max(120),
    problemTitle: z.string().trim().min(1).max(160),
    question: z.string().trim().min(1).max(1000),
    submittedAnswer: z.string().trim().min(1).max(1000),
    feedbackHint: z.string().trim().min(1).max(500)
  }),
  z.object({ action: z.literal("resolve"), source: sourceSchema, problemId: z.string().trim().min(1).max(120) })
]);

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "오답 기록 형식이 올바르지 않습니다." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (process.env.APP_ENV === "production") return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ demo: true });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  if (parsed.data.action === "resolve") {
    const { error } = await supabase
      .from("wrong_answers")
      .update({ resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", auth.user.id)
      .eq("source", parsed.data.source)
      .eq("problem_id", parsed.data.problemId)
      .is("resolved_at", null);
    if (error) return NextResponse.json({ error: "오답 상태를 갱신하지 못했습니다." }, { status: 500 });
    return NextResponse.json({ resolved: true });
  }

  const { data: existing } = await supabase
    .from("wrong_answers")
    .select("id,attempt_count")
    .eq("user_id", auth.user.id)
    .eq("source", parsed.data.source)
    .eq("problem_id", parsed.data.problemId)
    .maybeSingle();

  const payload = {
    source_label: parsed.data.sourceLabel,
    problem_title: parsed.data.problemTitle,
    question: parsed.data.question,
    submitted_answer: parsed.data.submittedAnswer,
    feedback_hint: parsed.data.feedbackHint,
    attempt_count: (existing?.attempt_count ?? 0) + 1,
    resolved_at: null,
    updated_at: new Date().toISOString()
  };
  const result = existing
    ? await supabase.from("wrong_answers").update(payload).eq("id", existing.id).eq("user_id", auth.user.id)
    : await supabase.from("wrong_answers").insert({ ...payload, user_id: auth.user.id, source: parsed.data.source, problem_id: parsed.data.problemId });

  if (result.error) return NextResponse.json({ error: "오답을 기록하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ recorded: true });
}
