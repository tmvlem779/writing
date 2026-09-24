"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseInviteHash } from "@/lib/auth/invite-redirect";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function InviteSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseInviteHash(window.location.hash)) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || error || !data.session) return;

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      router.replace("/set-password");
      router.refresh();
    });

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
