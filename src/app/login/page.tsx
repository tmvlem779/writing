import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <section className="auth-shell">
      <div className="auth-intro">
        <span className="eyebrow">학교 수업 전용</span>
        <h1>수업 계정으로<br />이어가세요</h1>
        <p>작성한 문장, 받은 도움, 학습 전후의 변화를 안전하게 저장합니다.</p>
        <Link href="/privacy">학생 데이터 안내 보기</Link>
      </div>
      <div className="auth-card">
        <h2>로그인</h2>
        <p>교사에게 받은 학교 계정을 입력하세요.</p>
        <LoginForm />
      </div>
    </section>
  );
}
