import { NextResponse } from "next/server";
import { activitySchema } from "@/lib/agent/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => ({}));
  const activity = activitySchema.catch("diagnose").parse(requestBody.activity);
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
    }
    return NextResponse.json({ id: `demo-${crypto.randomUUID()}`, demo: true });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data: membership } = await supabase
    .from("class_memberships")
    .select("class_id")
    .eq("user_id", auth.user.id)
    .eq("role", "student")
    .in("status", ["invited", "active"])
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("learning_sessions")
    .insert({ user_id: auth.user.id, class_id: membership?.class_id ?? null, activity_type: activity, status: "active" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "학습 세션을 만들 수 없습니다." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
