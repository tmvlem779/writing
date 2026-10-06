"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MondeukLoading, MondeukLoadingOverlay } from "@/components/mondeuk-loading";
import { meetsPasswordRequirements, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/auth/password-policy";

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
    if (!meetsPasswordRequirements(password)) {
      setMessage(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }
    setPending(true);
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setPending(false);
      setMessage(body?.error ?? "비밀번호를 설정하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    router.replace("/learn");
    router.refresh();
  }

  return <form className="auth-form" onSubmit={submit}>
    <label>새 비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{8,128}" title="영문자와 숫자를 모두 포함하여 8자 이상 입력하세요." autoComplete="new-password" required /></label>
    <label>새 비밀번호 확인<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{8,128}" title="영문자와 숫자를 모두 포함하여 8자 이상 입력하세요." autoComplete="new-password" required /></label>
    <button aria-busy={pending} className="primary-button full-button" type="submit" disabled={pending}>
      {pending ? <MondeukLoading compact message="새 비밀번호를 안전하게 저장하고 있어요." /> : "비밀번호 설정"}
    </button>
    {pending && <MondeukLoadingOverlay message="비밀번호를 저장하고 학습 화면을 준비하고 있어요." />}
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}
