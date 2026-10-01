"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MondeukLoadingOverlay } from "@/components/mondeuk-loading";
import { parsePasswordSetupHash } from "@/lib/auth/password-setup-redirect";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function PasswordSetupSessionRedirect() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const session = parsePasswordSetupHash(window.location.hash);
    if (!session) return;

    // Supabase dashboard invitations use an implicit token hash while the SSR
    // client uses PKCE. Remove the hash before client initialization, then
    // transfer the tokens into the cookie-backed session explicitly.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const activeSession = session;
    const authClient = supabase;

    let active = true;
    async function transferSession() {
      await Promise.resolve();
      if (!active) return;
      setPending(true);
      const { error } = await authClient.auth.setSession({
        access_token: activeSession.accessToken,
        refresh_token: activeSession.refreshToken
      });
      if (!active) return;
      if (error) {
        setPending(false);
        return;
      }
      router.replace("/set-password");
      router.refresh();
    }
    void transferSession();

    return () => {
      active = false;
    };
  }, [router]);

  return pending ? <MondeukLoadingOverlay message="초대 정보를 확인하고 비밀번호 설정 화면을 준비하고 있어요." /> : null;
}
