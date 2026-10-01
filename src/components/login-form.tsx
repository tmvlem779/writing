"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MondeukLoading, MondeukLoadingOverlay } from "@/components/mondeuk-loading";
import { isValidLoginId, normalizeLoginId, toSchoolAccountEmail } from "@/lib/auth/school-account";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"login" | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedLoginId = normalizeLoginId(loginId);
    if (!isValidLoginId(normalizedLoginId)) {
      setMessage("학교 아이디는 영문 소문자로 시작하고 소문자와 숫자로 4~32자 입력해 주세요.");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("개발 환경에 Supabase 연결 정보가 없습니다. 학습 화면에서 데모 흐름을 확인할 수 있습니다.");
      return;
    }
    setPendingAction("login");
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toSchoolAccountEmail(normalizedLoginId),
      password
    });
    if (error) {
      setPendingAction(null);
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
        학교 아이디
        <input type="text" value={loginId} onChange={(event) => setLoginId(event.target.value)} autoComplete="username" minLength={4} maxLength={32} pattern="[a-z][a-z0-9]{3,31}" required />
      </label>
      <label>
        비밀번호
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} required />
      </label>
      <button aria-busy={pendingAction === "login"} className="primary-button full-button" type="submit" disabled={pendingAction !== null}>
        {pendingAction === "login" ? <MondeukLoading compact message="학교 계정을 확인하고 있어요." /> : "로그인"}
      </button>
      {pendingAction === "login" && <MondeukLoadingOverlay message="로그인했어요. 학습 화면을 준비하고 있어요." />}
      {message && <p className="form-message" role="status">{message}</p>}
      <p className="form-note">아이디와 비밀번호는 담당 교사가 발급합니다. 잊었다면 담당 교사에게 문의하세요.</p>
    </form>
  );
}
