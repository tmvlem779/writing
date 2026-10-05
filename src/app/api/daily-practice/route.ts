import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDailyStreak, getDailyPracticePlan, getKoreanDate } from "@/lib/learning/daily-practice";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const completionSchema = z.object({
  sessionId: z.string().min(1).max(100)
});

type LearningEventRow = { metadata: unknown };

function isProduction() {
  return process.env.APP_ENV === "production" || process.env.VERCEL === "1";
}

function completionDatesFrom(rows: LearningEventRow[] | null | undefined) {
  const dates = (rows ?? []).flatMap((row) => {
    if (!row.metadata || typeof row.metadata !== "object") return [];
    const practiceDate = (row.metadata as Record<string, unknown>).practiceDate;
    return typeof practiceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(practiceDate) ? [practiceDate] : [];
  });
  return [...new Set(dates)].sort();
}

async function readCompletionDates(supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>, userId: string) {
  const { data, error } = await supabase
    .from("learning_events")
    .select("metadata")
    .eq("user_id", userId)
    .eq("event_type", "daily_practice_completed")
    .order("created_at", { ascending: false })
    .limit(400);
  if (error) throw new Error("일일 학습 기록을 불러오지 못했습니다.");
  return completionDatesFrom(data);
}

export async function GET() {
  const today = getKoreanDate();
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ demo: true, today, completionDates: [], streak: 0, todayCompleted: false });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const completionDates = await readCompletionDates(supabase, auth.user.id);
    return NextResponse.json({
      today,
      completionDates,
      streak: calculateDailyStreak(completionDates, today),
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
  const plan = getDailyPracticePlan(today);
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ demo: true, today, completionDates: [today], streak: 1, todayCompleted: true });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const existingDates = await readCompletionDates(supabase, auth.user.id);
    if (!existingDates.includes(today)) {
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
          practiceDate: today,
          practiceType: plan.type,
          materialId: plan.materialId,
          title: plan.title
        }
      });
      if (error) return NextResponse.json({ error: "오늘의 학습 완료 기록을 저장하지 못했습니다." }, { status: 500 });
    }

    const completionDates = [...new Set([...existingDates, today])].sort();
    return NextResponse.json({
      today,
      completionDates,
      streak: calculateDailyStreak(completionDates, today),
      todayCompleted: true
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "학습 완료를 기록하지 못했습니다." }, { status: 500 });
  }
}
