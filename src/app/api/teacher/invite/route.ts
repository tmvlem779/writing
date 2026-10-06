import { NextResponse } from "next/server";
import { z } from "zod";
import { meetsPasswordRequirements } from "@/lib/auth/password-policy";
import { isValidLoginId, normalizeLoginId, toSchoolAccountEmail } from "@/lib/auth/school-account";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  displayName: z.string().trim().min(1).max(30),
  loginId: z.string().transform(normalizeLoginId).refine(isValidLoginId),
  password: z.string().refine(meetsPasswordRequirements),
  classId: z.string().uuid()
});

export async function POST(request: Request) {
  const input = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "이름, 아이디, 비밀번호와 학급을 확인해 주세요." }, { status: 400 });

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

  const { data, error } = await admin.auth.admin.createUser({
    email: toSchoolAccountEmail(input.data.loginId),
    password: input.data.password,
    email_confirm: true,
    user_metadata: {
      role: "student",
      class_id: input.data.classId,
      login_id: input.data.loginId,
      display_alias: input.data.displayName
    }
  });
  if (error) return NextResponse.json({ error: "이미 사용 중인 아이디이거나 계정을 만들 수 없습니다." }, { status: 409 });

  if (data.user) {
    const { error: membershipError } = await admin.from("class_memberships").upsert({
      class_id: input.data.classId,
      user_id: data.user.id,
      role: "student",
      status: "active"
    });
    if (membershipError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: "학생을 학급에 연결하지 못했습니다." }, { status: 500 });
    }
  }
  return NextResponse.json({ created: true });
}
