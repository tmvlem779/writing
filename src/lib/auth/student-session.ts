import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getStudentSession() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { alias: "학생", className: "문법학급", demo: true, supabase: null, user: null };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    if (process.env.APP_ENV === "production") redirect("/login");
    return { alias: "학생", className: "문법학급", demo: true, supabase, user: null };
  }

  if (auth.user.user_metadata?.role === "teacher") redirect("/teacher");

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("display_alias").eq("user_id", auth.user.id).maybeSingle(),
    supabase
      .from("class_memberships")
      .select("classes(name)")
      .eq("user_id", auth.user.id)
      .eq("role", "student")
      .in("status", ["invited", "active"])
      .limit(1)
      .maybeSingle()
  ]);

  const joinedClass = membership?.classes as { name?: string } | Array<{ name?: string }> | null;
  const className = Array.isArray(joinedClass) ? joinedClass[0]?.name : joinedClass?.name;
  const metadataAlias = auth.user.user_metadata?.display_alias;
  const emailAlias = auth.user.email?.split("@")[0];

  return {
    alias: profile?.display_alias || metadataAlias || emailAlias || "학생",
    className: className || "문법학급",
    demo: false,
    supabase,
    user: auth.user
  };
}
