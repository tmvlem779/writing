"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";

export function InviteForm({ classId }: { classId: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await fetch("/api/teacher/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, classId })
    });
    const body = await result.json();
    setPending(false);
    setMessage(result.ok ? "학생 초대를 보냈습니다." : body.error ?? "초대하지 못했습니다.");
    if (result.ok) setEmail("");
  }

  return (
    <form className="invite-form" onSubmit={submit}>
      <label>학생 이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <button aria-busy={pending} type="submit" className="secondary-button" disabled={pending}>
        {pending ? <MondeukLoading compact message="학생 초대 메일을 보내고 있어요." /> : "학생 초대"}
      </button>
      {message && <span role="status">{message}</span>}
    </form>
  );
}
