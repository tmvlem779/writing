"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

  return <button className="dashboard-logout" disabled={pending} onClick={logout} type="button">{pending ? "나가는 중…" : "로그아웃"}</button>;
}
