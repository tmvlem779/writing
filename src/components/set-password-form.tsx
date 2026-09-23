"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("두 비밀번호가 서로 다릅니다.");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Supabase 연결 정보가 없습니다.");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setMessage("비밀번호를 설정하지 못했습니다. 초대 링크를 다시 열어 주세요.");
      return;
    }
    router.replace("/learn");
    router.refresh();
  }

  return <form className="auth-form" onSubmit={submit}>
    <label>새 비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required /></label>
    <label>새 비밀번호 확인<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" required /></label>
    <button className="primary-button full-button" type="submit" disabled={pending}>{pending ? "설정 중…" : "비밀번호 설정"}</button>
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}
