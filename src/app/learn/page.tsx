import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getStudentSession } from "@/lib/auth/student-session";

type SessionSummary = { status: string };
type ConceptSummary = { evidence_count: number; independent_success_count: number };

const dashboardCards = [
  { href: "/learn/diagnosis", kicker: "출발점 찾기", title: "AI 진단평가", description: "문장 구조와 문법 요소의 현재 이해를 8문항으로 살펴봐요.", accent: "orange" },
  { href: "/learn/challenge", kicker: "6차시 수업", title: "오늘의 챌린지", description: "구조+문법 요소 수업안으로 개념을 배우고 문장을 직접 만들어요.", accent: "green" },
  { href: "/learn/self-study", kicker: "실생활 적용", title: "스스로 유형 학습", description: "기사·안내문·대화·발표·인터뷰·SNS 자료를 분석하고 고쳐 써요.", accent: "lime" },
  { href: "/learn/wrong-notes", kicker: "다시 보기", title: "오답노트", description: "어느 학습 영역에서 어떤 문제를 놓쳤는지 확인하고 다시 도전해요.", accent: "paper" }
] as const;

export default async function LearnPage() {
  const { alias, className, demo, supabase, user } = await getStudentSession();
  let sessions: SessionSummary[] = [];
  let concepts: ConceptSummary[] = [];
  let wrongAnswerCount = 0;

  if (supabase && user) {
    const [sessionResult, conceptResult, wrongResult] = await Promise.all([
      supabase.from("learning_sessions").select("status").eq("user_id", user.id),
      supabase.from("concept_states").select("evidence_count,independent_success_count").eq("user_id", user.id),
      supabase.from("wrong_answers").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("resolved_at", null)
    ]);
    sessions = (sessionResult.data ?? []) as SessionSummary[];
    concepts = (conceptResult.data ?? []) as ConceptSummary[];
    wrongAnswerCount = wrongResult.count ?? 0;
  }

  const totalEvidence = concepts.reduce((sum, item) => sum + item.evidence_count, 0);
  const independentSuccess = concepts.reduce((sum, item) => sum + item.independent_success_count, 0);
  const completedSessions = sessions.filter((item) => item.status === "completed").length;
  const studentLabel = alias.endsWith("학생") ? alias : `${alias} 학생`;

  return (
    <section className="student-dashboard">
      <header className="student-dashboard-header">
        <Link className="dashboard-brand" href="/learn">문득문득</Link>
        <div>
          <p><strong>{studentLabel}</strong></p>
          <span>{className}</span>
          {!demo && <LogoutButton />}
        </div>
      </header>

      <div className="student-dashboard-intro">
        <span>오늘도 질문에서 시작해요</span>
        <h1>{studentLabel}의 문법 학습 공간</h1>
        <p>현재 실력을 살피고, 오늘의 수업에 도전하고, 실제 언어 자료로 스스로 연습해 보세요.</p>
      </div>

      <div className="student-dashboard-cards">
        {dashboardCards.map((card) => (
          <Link className={`student-dashboard-card ${card.accent}`} href={card.href} key={card.href}>
            <span>{card.kicker}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <strong>시작하기 <i aria-hidden="true">→</i></strong>
          </Link>
        ))}
      </div>

      <section className="dashboard-progress" aria-labelledby="dashboard-progress-title">
        <div>
          <span>나의 학습 현황</span>
          <h2 id="dashboard-progress-title">쌓인 과정이 다음 질문을 만듭니다</h2>
          <p>틀린 문제도 성장의 기록이에요. 오답을 다시 살펴보고 내 설명으로 바꿔 보세요.</p>
        </div>
        <dl>
          <div><dt>학습 세션</dt><dd>{sessions.length}</dd></div>
          <div><dt>완료 활동</dt><dd>{completedSessions}</dd></div>
          <div><dt>독립 성공</dt><dd>{independentSuccess}/{totalEvidence}</dd></div>
          <div><dt>다시 볼 문제</dt><dd>{wrongAnswerCount}</dd></div>
        </dl>
      </section>
    </section>
  );
}
