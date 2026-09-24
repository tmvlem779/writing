"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    setPending(true);
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setMessage(body?.error ?? "비밀번호를 설정하지 못했습니다. 잠시 후 다시 시도해 주세요.");
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
