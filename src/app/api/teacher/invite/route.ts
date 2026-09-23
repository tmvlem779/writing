import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  email: z.string().email(),
  classId: z.string().uuid()
});

export async function POST(request: Request) {
  const input = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "이메일과 학급을 확인해 주세요." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  if (!supabase || !admin) return NextResponse.json({ error: "서버 설정이 필요합니다." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data: membership } = await admin
    .from("class_memberships")
    .select("role")
    .eq("class_id", input.data.classId)
    .eq("user_id", auth.user.id)
    .eq("role", "teacher")
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "교사 권한이 필요합니다." }, { status: 403 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.data.email, {
    data: { role: "student", class_id: input.data.classId },
    redirectTo: `${origin}/auth/confirm?next=/set-password`
  });
  if (error) return NextResponse.json({ error: "초대 메일을 보낼 수 없습니다." }, { status: 500 });

  if (data.user) {
    const { error: membershipError } = await admin.from("class_memberships").upsert({
      class_id: input.data.classId,
      user_id: data.user.id,
      role: "student",
      status: "invited"
    });
    if (membershipError) return NextResponse.json({ error: "학생을 학급에 연결하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ invited: true });
}
