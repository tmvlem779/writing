"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parsePasswordSetupHash } from "@/lib/auth/password-setup-redirect";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function PasswordSetupSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = parsePasswordSetupHash(window.location.hash);
    if (!session) return;

    // Supabase dashboard invitations use an implicit token hash while the SSR
    // client uses PKCE. Remove the hash before client initialization, then
    // transfer the tokens into the cookie-backed session explicitly.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    }).then(({ error }) => {
      if (!active || error) return;
      router.replace("/set-password");
      router.refresh();
    });

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
