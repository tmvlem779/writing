import { NextResponse } from "next/server";
import { z } from "zod";
import { agentResponseSchema } from "@/lib/agent/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const materialIdSchema = z.string().trim().min(1).max(80);
const messageSchema = z.object({
  role: z.enum(["student", "assistant"]),
  content: z.string().max(2000)
});
const stateSchema = z.object({
  mode: z.enum(["structure", "effect", "rewrite"]),
  completedModes: z.array(z.enum(["structure", "effect", "rewrite"])).max(3),
  learningQuestionCount: z.number().int().min(0).max(3),
  draft: z.string().max(2500),
  response: agentResponseSchema.nullable(),
  history: z.array(messageSchema).max(6),
  scaffoldLevel: z.number().int().min(0).max(4),
  attemptCount: z.number().int().min(0).max(20),
  questionAttemptCount: z.number().int().min(0).max(20),
  questionHintCount: z.number().int().min(0).max(20)
});
const saveSchema = z.object({
  sessionId: z.string().min(1).max(100),
  practiceDate: dateSchema,
  materialId: materialIdSchema,
  state: stateSchema
});

function progressKey(practiceDate: string, materialId: string) {
  return `daily-real-life:${practiceDate}:${materialId}`;
}

function isProduction() {
  return process.env.APP_ENV === "production" || process.env.VERCEL === "1";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = z.object({
    practiceDate: dateSchema,
    materialId: materialIdSchema
  }).safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "학습 위치가 올바르지 않습니다." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (isProduction()) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    return NextResponse.json({ state: null, demo: true });
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("drafts")
    .select("session_id,content,updated_at")
    .eq("user_id", auth.user.id)
    .eq("revision_reason", progressKey(parsed.data.practiceDate, parsed.data.materialId))
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "학습 진행을 불러오지 못했습니다." }, { status: 500 });
  if (!data) return NextResponse.json({ state: null });

  try {
    const state = stateSchema.safeParse(JSON.parse(data.content));
    return NextResponse.json(state.success ? { state: state.data, sessionId: data.session_id } : { state: null });
  } catch {
    return NextResponse.json({ state: null });
  }
}

export async function POST(request: Request) {
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "학습 진행 정보가 올바르지 않습니다." }, { status: 400 });

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
  if (!session) return NextResponse.json({ error: "본인의 학습 진행만 저장할 수 있습니다." }, { status: 403 });

  const key = progressKey(parsed.data.practiceDate, parsed.data.materialId);
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
    content: JSON.stringify(parsed.data.state),
    revision_reason: key,
    updated_at: new Date().toISOString()
  };
  const result = existing
    ? await supabase.from("drafts").update(payload).eq("id", existing.id).eq("user_id", auth.user.id)
    : await supabase.from("drafts").insert({ ...payload, user_id: auth.user.id });
  if (result.error) return NextResponse.json({ error: "학습 진행을 저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
