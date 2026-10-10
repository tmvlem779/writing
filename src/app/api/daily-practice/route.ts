import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDailyStreak, getDailyPracticePlan, getKoreanDate, getSelectablePracticeDate } from "@/lib/learning/daily-practice";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const completionSchema = z.object({
  sessionId: z.string().min(1).max(100),
  practiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

type LearningEventRow = { metadata: unknown; created_at: string };

function isProduction() {
  return process.env.APP_ENV === "production" || process.env.VERCEL === "1";
}

function completionProgressFrom(rows: LearningEventRow[] | null | undefined) {
  const byDate = new Map<string, { completedOnTime: boolean }>();
  for (const row of rows ?? []) {
    if (!row.metadata || typeof row.metadata !== "object") continue;
    const practiceDate = (row.metadata as Record<string, unknown>).practiceDate;
    if (typeof practiceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(practiceDate)) continue;
    const completedDate = getKoreanDate(new Date(row.created_at));
    const previous = byDate.get(practiceDate);
    byDate.set(practiceDate, { completedOnTime: previous?.completedOnTime === true || completedDate <= practiceDate });
  }
  const completionDates = [...byDate.keys()].sort();
  const lateCompletionDates = completionDates.filter((date) => !byDate.get(date)?.completedOnTime);
  const onTimeCompletionDates = completionDates.filter((date) => byDate.get(date)?.completedOnTime);
  return { completionDates, lateCompletionDates, onTimeCompletionDates };
}

async function readCompletionProgress(supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>, userId: string) {
  const { data, error } = await supabase
    .from("learning_events")
    .select("metadata, created_at")
    .eq("user_id", userId)
    .eq("event_type", "daily_practice_completed")
    .order("created_at", { ascending: false })
    .limit(400);
  if (error) throw new Error("일일 학습 기록을 불러오지 못했습니다.");
  return completionProgressFrom(data);
}

export async function GET() {
  const today = getKoreanDate();
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ demo: true, today, completionDates: [], lateCompletionDates: [], streak: 0, todayCompleted: false });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const { completionDates, lateCompletionDates, onTimeCompletionDates } = await readCompletionProgress(supabase, auth.user.id);
    return NextResponse.json({
      today,
      completionDates,
      lateCompletionDates,
      streak: calculateDailyStreak(onTimeCompletionDates, today),
      todayCompleted: completionDates.includes(today)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "학습 기록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = completionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "학습 완료 정보가 올바르지 않습니다." }, { status: 400 });

  const today = getKoreanDate();
  const practiceDate = parsed.data.practiceDate ?? today;
  if (practiceDate !== getSelectablePracticeDate(practiceDate, today)) {
    return NextResponse.json({ error: "학습할 수 있는 날짜가 아닙니다." }, { status: 400 });
  }
  const plan = getDailyPracticePlan(practiceDate);
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({
      demo: true,
      today,
      completionDates: [practiceDate],
      lateCompletionDates: practiceDate < today ? [practiceDate] : [],
      streak: practiceDate === today ? 1 : 0,
      todayCompleted: practiceDate === today
    });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const existing = await readCompletionProgress(supabase, auth.user.id);
    const alreadyCompleted = existing.completionDates.includes(practiceDate);
    if (!alreadyCompleted) {
      const { data: session } = await supabase
        .from("learning_sessions")
        .select("id")
        .eq("id", parsed.data.sessionId)
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!session) return NextResponse.json({ error: "본인의 학습 세션만 완료 처리할 수 있습니다." }, { status: 403 });

      const { error } = await supabase.from("learning_events").insert({
        session_id: session.id,
        user_id: auth.user.id,
        event_type: "daily_practice_completed",
        concept_code: "daily_practice",
        metadata: {
          practiceDate,
          practiceType: plan.type,
          materialId: plan.materialId,
          title: plan.title
        }
      });
      if (error) return NextResponse.json({ error: "학습 완료 기록을 저장하지 못했습니다." }, { status: 500 });
    }

    const completionDates = [...new Set([...existing.completionDates, practiceDate])].sort();
    const lateCompletionDates = [...new Set([
      ...existing.lateCompletionDates,
      ...(!alreadyCompleted && practiceDate < today ? [practiceDate] : [])
    ])].sort();
    const onTimeCompletionDates = completionDates.filter((date) => !lateCompletionDates.includes(date));
    return NextResponse.json({
      today,
      completionDates,
      lateCompletionDates,
      streak: calculateDailyStreak(onTimeCompletionDates, today),
      todayCompleted: completionDates.includes(today)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "학습 완료를 기록하지 못했습니다." }, { status: 500 });
  }
}
