import { NextResponse } from "next/server";
import { z } from "zod";
import { primaryActivityAnswersSchema } from "@/lib/learning/primary-activity-answer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  trackId: z.enum(["structure", "grammar"]),
  lessonNumber: z.number().int().min(1).max(6)
});

const saveSchema = locationSchema.extend({
  sessionId: z.string().min(1).max(100),
  answers: primaryActivityAnswersSchema
});

function revisionReason(trackId: string, lessonNumber: number) {
  return `challenge-primary-answers:${trackId}:${lessonNumber}`;
}

function isProduction() {
  return process.env.APP_ENV === "production" || process.env.VERCEL === "1";
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ answers: [], demo: true });
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("drafts")
    .select("revision_reason,content,updated_at")
    .eq("user_id", auth.user.id)
    .like("revision_reason", "challenge-primary-answers:%")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "앞 활동의 문장을 불러오지 못했습니다." }, { status: 500 });

  const seen = new Set<string>();
  const answers = (data ?? []).flatMap((row) => {
    if (seen.has(row.revision_reason)) return [];
    seen.add(row.revision_reason);
    const match = /^challenge-primary-answers:(structure|grammar):([1-6])$/.exec(row.revision_reason);
    if (!match) return [];
    try {
      const parsed = primaryActivityAnswersSchema.safeParse(JSON.parse(row.content));
      if (!parsed.success) return [];
      return [{ trackId: match[1], lessonNumber: Number(match[2]), answers: parsed.data }];
    } catch {
      return [];
    }
  });
  return NextResponse.json({ answers });
}

export async function POST(request: Request) {
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "앞 활동 문장 정보가 올바르지 않습니다." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ saved: true, demo: true });
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data: session } = await supabase
    .from("learning_sessions")
    .select("id")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "본인의 학습 답만 저장할 수 있습니다." }, { status: 403 });

  const key = revisionReason(parsed.data.trackId, parsed.data.lessonNumber);
  const { data: existing } = await supabase
    .from("drafts")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("revision_reason", key)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const payload = {
    session_id: session.id,
    content: JSON.stringify(parsed.data.answers),
    revision_reason: key,
    updated_at: new Date().toISOString()
  };
  const result = existing
    ? await supabase.from("drafts").update(payload).eq("id", existing.id).eq("user_id", auth.user.id)
    : await supabase.from("drafts").insert({ ...payload, user_id: auth.user.id });
  if (result.error) return NextResponse.json({ error: "앞 활동의 문장을 저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
