import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <section className="auth-shell">
      <div className="auth-intro">
        <div className="auth-intro-copy">
          <h1>문득문득</h1>
          <p className="auth-slogan">
            <strong className="slogan-question">질문</strong>으로{" "}
            <strong className="slogan-discover">깨닫</strong>고{" "}
            <strong className="slogan-sentence">문장</strong>으로{" "}
            <strong className="slogan-gain">얻</strong>는다
          </p>
        </div>
      </div>
      <div className="auth-card">
        <h2>로그인</h2>
        <p>교사에게 받은 학교 계정을 입력하세요.</p>
        <LoginForm />
      </div>
    </section>
  );
}
