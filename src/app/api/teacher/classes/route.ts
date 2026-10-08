import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const classSchema = z.object({
  name: z.string().trim().min(1).max(40)
});

export async function POST(request: Request) {
  const input = classSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "학급 이름을 1~40자로 입력해 주세요." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  if (!supabase || !admin) return NextResponse.json({ error: "서버 설정이 필요합니다." }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data: profile } = await admin.from("profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return NextResponse.json({ error: "교사 권한이 필요합니다." }, { status: 403 });
  }

  const { data: duplicate } = await admin.from("classes").select("id")
    .eq("teacher_id", auth.user.id).eq("name", input.data.name).eq("active", true).limit(1).maybeSingle();
  if (duplicate) return NextResponse.json({ error: "같은 이름의 학급이 이미 있습니다." }, { status: 409 });

  const { data: createdClass, error: classError } = await admin.from("classes")
    .insert({ name: input.data.name, teacher_id: auth.user.id })
    .select("id,name")
    .single();
  if (classError || !createdClass) return NextResponse.json({ error: "학급을 만들지 못했습니다." }, { status: 500 });

  const { error: membershipError } = await admin.from("class_memberships").insert({
    class_id: createdClass.id,
    user_id: auth.user.id,
    role: "teacher",
    status: "active"
  });
  if (membershipError) {
    await admin.from("classes").delete().eq("id", createdClass.id).eq("teacher_id", auth.user.id);
    return NextResponse.json({ error: "학급 소속을 연결하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ class: createdClass }, { status: 201 });
}
