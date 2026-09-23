import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next") ?? "/set-password";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/set-password";
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    }
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", "초대 링크를 확인할 수 없습니다. 담당 교사에게 새 초대를 요청하세요.");
  return NextResponse.redirect(loginUrl);
}
