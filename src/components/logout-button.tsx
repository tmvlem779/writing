"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MondeukLoading, MondeukLoadingOverlay } from "@/components/mondeuk-loading";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button aria-busy={pending} className="dashboard-logout" disabled={pending} onClick={logout} type="button">
        {pending ? <MondeukLoading compact message="안전하게 로그아웃하고 있어요." /> : "로그아웃"}
      </button>
      {pending && <MondeukLoadingOverlay message="안전하게 로그아웃하고 있어요." />}
    </>
  );
}
