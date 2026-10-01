"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";

export function InviteForm({ classId }: { classId: string }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await fetch("/api/teacher/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password, classId })
      });
      const body = await result.json();
      setMessage(result.ok ? "학생 계정을 만들었습니다." : body.error ?? "학생 계정을 만들지 못했습니다.");
      if (result.ok) {
        setLoginId("");
        setPassword("");
      }
    } catch {
      setMessage("학생 계정을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="invite-form" onSubmit={submit}>
      <label>학생 아이디<input type="text" value={loginId} onChange={(event) => setLoginId(event.target.value)} minLength={4} maxLength={32} pattern="[a-z][a-z0-9]{3,31}" autoComplete="off" required /></label>
      <label>초기 비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} pattern="(?=.*[a-z])(?=.*[0-9])[a-z0-9]{8,128}" autoComplete="new-password" required /></label>
      <button aria-busy={pending} type="submit" className="secondary-button" disabled={pending}>
        {pending ? <MondeukLoading compact message="학생 계정을 만들고 있어요." /> : "학생 계정 만들기"}
      </button>
      {message && <span role="status">{message}</span>}
    </form>
  );
}
