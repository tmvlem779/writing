import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <section className="auth-shell">
      <div className="auth-intro">
        <h1>문득문득</h1>
      </div>
      <div className="auth-card">
        <h2>로그인</h2>
        <p>교사에게 받은 학교 계정을 입력하세요.</p>
        <LoginForm />
      </div>
    </section>
  );
}
