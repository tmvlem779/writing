"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("개발 환경에 Supabase 연결 정보가 없습니다. 학습 화면에서 데모 흐름을 확인할 수 있습니다.");
      return;
    }
    setPending(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setMessage("로그인 정보를 확인하거나 담당 교사에게 계정 초대를 요청하세요.");
      return;
    }
    const role = data.user?.user_metadata?.role;
    router.push(role === "teacher" ? "/teacher" : "/learn");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        학교 이메일
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label>
        비밀번호
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} required />
      </label>
      <button className="primary-button full-button" type="submit" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
      {message && <p className="form-message" role="status">{message}</p>}
      <p className="form-note">계정은 담당 교사가 초대합니다. 공개 회원가입은 제공하지 않습니다.</p>
    </form>
  );
}
