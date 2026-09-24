import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next") ?? "/set-password";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/set-password";
  const successResponse = NextResponse.redirect(new URL(next, url.origin));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabase = supabaseUrl && publishableKey
    ? createServerClient(supabaseUrl, publishableKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (items) => {
            items.forEach(({ name, value, options }) => {
              successResponse.cookies.set(name, value, options);
            });
          }
        }
      })
    : null;

  if (supabase) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return successResponse;
    }
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return successResponse;
    }
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", "초대 링크를 확인할 수 없습니다. 담당 교사에게 새 초대를 요청하세요.");
  return NextResponse.redirect(loginUrl);
}
