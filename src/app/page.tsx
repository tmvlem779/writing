import Link from "next/link";

const principles = [
  ["01", "진단과 맞춤 비계", "현재 수행을 살피고 꼭 필요한 만큼만 도움을 제공합니다."],
  ["02", "단계적 문장 확장", "기본 문장에서 수식어와 절을 더하며 표현을 넓힙니다."],
  ["03", "생각을 여는 질문", "관찰하고, 분석하고, 근거를 설명하도록 질문합니다."],
  ["04", "구조와 의미 비교", "문장 구조가 강조점과 표현 효과를 어떻게 바꾸는지 탐구합니다."],
  ["05", "오류에서 배우기", "정답을 바로 받기보다 문제를 찾고 직접 수정합니다."],
  ["06", "글쓰기로 전이", "익힌 구조를 새 글에 적용하고 변화를 스스로 돌아봅니다."]
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">고등학교 국어 · 문장의 구조와 확장</div>
        <h1>문장을 대신 써 주는 AI가 아니라,<br />생각을 끌어내는 글쓰기 도우미</h1>
        <p className="hero-copy">
          문장나래는 질문과 단계적 힌트로 문장의 구조를 발견하고, 직접 고치고,
          실제 글쓰기에 적용하도록 돕습니다.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" href="/learn">학습 시작하기</Link>
          <Link className="secondary-button" href="/login">학교 계정으로 로그인</Link>
        </div>
        <div className="trust-row" aria-label="서비스 특징">
          <span>학교 수업 전용</span>
          <span>한국어 전용</span>
          <span>교사와 함께 확인</span>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="section-heading">
          <span>학습 원리</span>
          <h2 id="how-title">스스로 발견하고 고치는 여섯 단계</h2>
          <p>AI의 설명보다 학생의 관찰, 생성, 비교, 수정이 먼저입니다.</p>
        </div>
        <div className="principle-grid">
          {principles.map(([number, title, body]) => (
            <article className="principle-card" key={number}>
              <span className="principle-number">{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-section">
        <div>
          <span className="section-kicker">수업 흐름</span>
          <h2>한 문장에서 실제 글쓰기까지</h2>
        </div>
        <ol className="journey-list">
          <li><strong>진단</strong><span>문장 성분과 호응을 설명해 봅니다.</span></li>
          <li><strong>생성</strong><span>주어진 요소로 기본 문장을 직접 만듭니다.</span></li>
          <li><strong>확장</strong><span>수식어와 절을 더하고 의미 변화를 비교합니다.</span></li>
          <li><strong>재구성</strong><span>오류를 찾고 근거를 말한 뒤 직접 수정합니다.</span></li>
          <li><strong>전이</strong><span>새로운 상황의 짧은 글에 배운 구조를 적용합니다.</span></li>
        </ol>
      </section>
    </>
  );
}
