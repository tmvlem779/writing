"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClassCreateForm({ onCreated }: { onCreated?: (classId: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "학급을 만들지 못했습니다.");
        return;
      }
      setName("");
      setOpen(false);
      setMessage("학급을 등록했습니다.");
      if (typeof body.class?.id === "string") onCreated?.(body.class.id);
      router.refresh();
    } catch {
      setMessage("학급을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="class-create-control">
      <button
        aria-expanded={open}
        aria-controls="class-create-form"
        className="class-create-button"
        onClick={() => { setOpen((value) => !value); setMessage(""); }}
        type="button"
      >
        <span aria-hidden="true">＋</span> 학급 등록
      </button>
      {open && (
        <form className="class-create-form" id="class-create-form" onSubmit={submit}>
          <label htmlFor="class-name">학급 이름</label>
          <div>
            <input
              autoComplete="off"
              id="class-name"
              maxLength={40}
              minLength={1}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 2학년 국어 A반"
              required
              type="text"
              value={name}
            />
            <button disabled={pending} type="submit">{pending ? "등록 중…" : "등록"}</button>
            <button onClick={() => { setOpen(false); setName(""); }} type="button">취소</button>
          </div>
        </form>
      )}
      {message && <p className="class-create-message" role="status">{message}</p>}
    </div>
  );
}
