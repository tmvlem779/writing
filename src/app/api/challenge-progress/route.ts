import { NextResponse } from "next/server";
import { challengeProgressInputSchema, type ChallengeProgressRecord } from "@/lib/learning/challenge-progress";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function unavailableInProduction() {
  return process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (unavailableInProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ progress: [], demo: true });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("challenge_progress")
    .select("track_id, lesson_number, concept_completed, completed_activity_ids, last_chapter, last_activity_id, updated_at")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "학습 진행 상황을 불러오지 못했습니다." }, { status: 500 });

  const progress: ChallengeProgressRecord[] = (data ?? []).map((row) => ({
    trackId: row.track_id,
    lessonNumber: row.lesson_number,
    conceptCompleted: row.concept_completed,
    completedActivityIds: row.completed_activity_ids,
    lastChapter: row.last_chapter,
    lastActivityId: row.last_activity_id,
    updatedAt: row.updated_at
  }));
  return NextResponse.json({ progress });
}

export async function POST(request: Request) {
  const input = challengeProgressInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "학습 진행 형식을 확인해 주세요." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (unavailableInProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ ...input.data, updatedAt: new Date().toISOString(), demo: true });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("challenge_progress")
    .upsert({
      user_id: auth.user.id,
      track_id: input.data.trackId,
      lesson_number: input.data.lessonNumber,
      concept_completed: input.data.conceptCompleted,
      completed_activity_ids: input.data.completedActivityIds,
      last_chapter: input.data.lastChapter,
      last_activity_id: input.data.lastActivityId,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,track_id,lesson_number" })
    .select("updated_at")
    .single();
  if (error) return NextResponse.json({ error: "학습 진행 상황을 저장하지 못했습니다." }, { status: 500 });

  return NextResponse.json({ ...input.data, updatedAt: data.updated_at });
}
