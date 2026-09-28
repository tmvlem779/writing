import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero" aria-labelledby="home-title">
      <div className="hero-content">
        <h1 id="home-title">
          질문으로 얻고, 문장으로 깨닫다
          <span>— 문득문득</span>
        </h1>
        <p className="hero-copy">
          문득문득은 답을 대신 써주지 않습니다.
          <span>단계별 질문으로 생각의 문을 열고, 스스로 올바른 문장을 쓰도록 돕습니다.</span>
        </p>
        <div className="hero-actions">
          <Link className="primary-button" href="/learn">학습 시작하기</Link>
          <Link className="secondary-button" href="/login">학교 계정으로 로그인</Link>
        </div>
      </div>
    </section>
  );
}
