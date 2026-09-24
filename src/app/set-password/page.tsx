import { SetPasswordForm } from "@/components/set-password-form";

export default function SetPasswordPage() {
  return <section className="auth-shell">
    <div className="auth-intro">
      <span className="eyebrow">학교 계정 시작</span>
      <h1>나만의 비밀번호를<br />설정하세요</h1>
      <p>담당 교사가 보낸 초대 링크를 통해서만 계정을 시작할 수 있습니다.</p>
    </div>
    <div className="auth-card">
      <h2>비밀번호 설정</h2>
      <p>8자 이상으로 영문 소문자·대문자·숫자·특수문자를 각각 1개 이상 포함하세요.</p>
      <SetPasswordForm />
    </div>
  </section>;
}
