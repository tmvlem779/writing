import type { Route } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LearningMark } from "@/components/learning-mark";
import { LogoutButton } from "@/components/logout-button";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getStudentSession } from "@/lib/auth/student-session";

type SessionSummary = { status: string };
type ConceptSummary = { concept_code: string; scaffold_level: number; evidence_count: number; independent_success_count: number };

const activityLabels: Record<string, string> = {
  diagnose: "문장 구조 진단",
  create: "문장 만들기",
  expand: "문장 확장",
  compare: "구조 비교",
  error: "오류 고쳐 쓰기",
  transfer: "짧은 글쓰기",
  reflect: "학습 성찰",
  authentic: "실생활·문학 분석"
};

const dashboardCards = [
  { href: "/learn/challenge", kicker: "6차시 수업", title: "오늘의 챌린지", description: "구조+문법 요소 수업안으로 개념을 배우고 문장을 직접 만들어요.", accent: "green", icon: "challenge" },
  { href: "/learn/self-study", kicker: "문학·실생활·상황 적용", title: "스스로 유형 학습", description: "자료를 분석하고 주어진 상황을 바탕으로 자신의 문장을 직접 만들어요.", accent: "lime", icon: "practice" },
  { href: "/learn/wrong-notes", kicker: "다시 보기", title: "오답노트", description: "어느 학습 영역에서 어떤 문제를 놓쳤는지 확인하고 다시 도전해요.", accent: "paper", icon: "review" }
] as const;

export default async function LearnPage() {
  const { alias, className, demo, supabase, user } = await getStudentSession();
  let sessions: SessionSummary[] = [];
  let concepts: ConceptSummary[] = [];
  let wrongAnswerCount = 0;

  if (supabase && user) {
    const [sessionResult, conceptResult, wrongResult] = await Promise.all([
      supabase.from("learning_sessions").select("status").eq("user_id", user.id),
      supabase.from("concept_states").select("concept_code,scaffold_level,evidence_count,independent_success_count").eq("user_id", user.id),
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
  const masteryRate = totalEvidence > 0 ? Math.round((independentSuccess / totalEvidence) * 100) : 0;
  const strongConcepts = concepts
    .filter((item) => item.independent_success_count > 0 && item.independent_success_count / Math.max(item.evidence_count, 1) >= 0.5)
    .sort((a, b) => b.independent_success_count - a.independent_success_count)
    .slice(0, 2)
    .map((item) => activityLabels[item.concept_code] ?? item.concept_code);
  const practiceConcepts = concepts
    .filter((item) => item.evidence_count > item.independent_success_count || item.scaffold_level >= 2)
    .sort((a, b) => b.scaffold_level - a.scaffold_level || (b.evidence_count - b.independent_success_count) - (a.evidence_count - a.independent_success_count))
    .slice(0, 2)
    .map((item) => activityLabels[item.concept_code] ?? item.concept_code);
  const scaffoldLevel = concepts.length > 0
    ? Math.round(concepts.reduce((sum, item) => sum + item.scaffold_level, 0) / concepts.length)
    : 0;
  const nextActivity: { href: Route; label: string; note: string } = wrongAnswerCount > 0
    ? { href: "/learn/wrong-notes", label: "오답 다시 설명하기", note: "놓친 문제부터 다시 살펴봐요!" }
    : totalEvidence === 0
      ? { href: "/learn/self-study", label: "상황 문장 만들기", note: "학교생활 상황을 읽고 첫 문장을 만들어 봐요!" }
      : practiceConcepts.length > 0
        ? { href: "/learn/challenge", label: `${practiceConcepts[0]} 연습`, note: "조금 더 필요한 영역을 연습해요!" }
        : { href: "/learn/self-study", label: "상황 문장 만들기", note: "배운 개념을 새 상황에 적용해 봐요!" };

  return (
    <section className="student-dashboard">
      <header className="student-dashboard-header">
        <BrandLogo className="dashboard-brand" href="/learn" />
        <div>
          <p><strong>{studentLabel}</strong></p>
          <span>{className}</span>
          {!demo && <LogoutButton />}
        </div>
      </header>

      <div className="student-dashboard-intro">
        <span>오늘도 질문에서 시작해요</span>
        <h1>{studentLabel}의 문법 학습 공간</h1>
        <p>오늘의 수업에 도전하고, 문학·실생활 자료와 학교생활 상황으로 스스로 문장을 만들어 보세요.</p>
      </div>

      <div className="student-dashboard-cards">
        {dashboardCards.map((card, index) => (
          <Link className={`student-dashboard-card ${card.accent} dashboard-card-${index + 1}`} href={card.href} key={card.href}>
            <div className="dashboard-card-topline"><span>{card.kicker}</span><span className="dashboard-card-mark"><LearningMark name={card.icon} /></span></div>
            <span className="dashboard-card-index" aria-hidden="true">0{index + 1}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <strong>시작하기 <i aria-hidden="true">→</i></strong>
          </Link>
        ))}
      </div>

      <section className="dashboard-progress" aria-labelledby="dashboard-progress-title">
        <header>
          <div><LearningMark name="growth" /><h2 id="dashboard-progress-title">나의 학습 현황</h2></div>
          <Link href="/history">더보기 <span aria-hidden="true">→</span></Link>
        </header>
        <div className="learning-status-list">
          <article className="learning-status-item status-strong">
            <LearningMark name="growth" />
            <div><p><strong>스스로 해결한 유형</strong><span>{masteryRate >= 60 ? "잘하고 있어요!" : "차근차근 쌓는 중이에요."}</span></p><div className="status-progress" aria-label={`독립 해결률 ${masteryRate}%`}><i style={{ width: `${masteryRate}%` }} /></div><div className="status-tags">{strongConcepts.length > 0 ? strongConcepts.map((label) => <span key={label}>{label}</span>) : <span>첫 성공을 기다려요</span>}</div></div>
          </article>
          <article className="learning-status-item status-support">
            <LearningMark name="support" />
            <div><p><strong>도움이 필요한 영역</strong><span>{practiceConcepts.length > 0 ? "조금 더 연습해요!" : "새로운 문제에 도전해 봐요."}</span></p><div className="status-tags">{practiceConcepts.length > 0 ? practiceConcepts.map((label) => <span key={label}>{label}</span>) : <span>아직 발견되지 않았어요</span>}</div></div>
          </article>
          <article className="learning-status-item status-scaffold">
            <LearningMark name="scaffold" />
            <div><p><strong>현재 비계 수준</strong><span>{scaffoldLevel <= 2 ? "적절한 수준이에요." : "충분한 도움으로 연습 중이에요."}</span></p><div className="status-progress" aria-label={`비계 ${scaffoldLevel + 1}단계`}><i style={{ width: `${((scaffoldLevel + 1) / 5) * 100}%` }} /></div><div className="status-tags"><span>{scaffoldLevel + 1}단계 · {scaffoldLabel(scaffoldLevel)}</span></div></div>
          </article>
          <Link className="learning-status-item status-next" href={nextActivity.href}>
            <LearningMark name="next" />
            <div><p><strong>추천 다음 활동</strong><span>{nextActivity.note}</span></p><div className="next-activity-chip">{nextActivity.label}<span aria-hidden="true">›</span></div></div>
          </Link>
        </div>
        <footer><span>학습 세션 <strong>{sessions.length}</strong></span><span>완료 활동 <strong>{completedSessions}</strong></span><span>독립 성공 <strong>{independentSuccess}/{totalEvidence}</strong></span><span>다시 볼 문제 <strong>{wrongAnswerCount}</strong></span></footer>
      </section>
    </section>
  );
}
