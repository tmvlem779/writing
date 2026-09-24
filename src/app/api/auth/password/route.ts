import { NextResponse } from "next/server";
import { passwordUpdateSchema } from "@/lib/auth/password";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const input = passwordUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "비밀번호는 8자 이상 128자 이하로 입력해 주세요." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "서버 연결 정보가 없습니다." }, { status: 503 });
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "비밀번호 설정 링크가 만료되었습니다. 새 링크를 열어 주세요." }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password: input.data.password });
  if (error) {
    return NextResponse.json({ error: "비밀번호를 설정하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ updated: true });
}
