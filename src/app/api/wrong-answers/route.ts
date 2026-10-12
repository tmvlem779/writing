import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWrongNotePractice, checkWrongNotePracticeAnswers } from "@/lib/learning/wrong-note-practice";
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
  z.object({
    action: z.literal("check-review"),
    noteId: z.string().uuid(),
    answers: z.array(z.array(z.string().trim().min(1).max(80)).min(1).max(8)).min(1).max(3)
  })
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

  if (parsed.data.action === "check-review") {
    const { data: note, error: noteError } = await supabase
      .from("wrong_answers")
      .select("id,source,problem_id,problem_title,question,submitted_answer,feedback_hint")
      .eq("id", parsed.data.noteId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (noteError) return NextResponse.json({ error: "오답 정보를 불러오지 못했습니다." }, { status: 500 });
    if (!note) return NextResponse.json({ error: "본인의 오답만 다시 풀 수 있습니다." }, { status: 404 });

    const practice = buildWrongNotePractice({
      id: note.id,
      source: note.source,
      problemId: note.problem_id,
      problemTitle: note.problem_title,
      question: note.question,
      submittedAnswer: note.submitted_answer,
      feedbackHint: note.feedback_hint
    });
    if (!practice) return NextResponse.json({ error: "이 오답은 원래 학습 영역에서 다시 풀어 주세요." }, { status: 422 });

    const currentIndex = parsed.data.answers.length - 1;
    const correct = checkWrongNotePracticeAnswers(practice, parsed.data.answers);
    if (!correct) {
      return NextResponse.json({ correct: false, resolved: false, hint: practice.questions[currentIndex].hint });
    }

    const resolved = parsed.data.answers.length === practice.questions.length;
    if (resolved) {
      const { error: updateError } = await supabase
        .from("wrong_answers")
        .update({ resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", note.id)
        .eq("user_id", auth.user.id);
      if (updateError) return NextResponse.json({ error: "오답 해결 상태를 저장하지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({
      correct: true,
      resolved,
      explanation: practice.questions[currentIndex].explanation,
      nextQuestionIndex: resolved ? null : currentIndex + 1
    });
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
