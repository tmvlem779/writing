import Link from "next/link";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SessionRow = { id: string; activity_type: string; status: string; updated_at: string };
type ConceptRow = { concept_code: string; scaffold_level: number; evidence_count: number; independent_success_count: number };

const activityLabels: Record<string, string> = {
  diagnose: "시작 진단", create: "문장 만들기", expand: "문장 확장", compare: "구조 비교",
  error: "오류 탐구", transfer: "짧은 글쓰기", reflect: "성찰", authentic: "실생활 자료"
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let sessions: SessionRow[] = [];
  let concepts: ConceptRow[] = [];

  if (supabase && auth.user) {
    const [sessionResult, conceptResult] = await Promise.all([
      supabase.from("learning_sessions").select("id,activity_type,status,updated_at").order("updated_at", { ascending: false }).limit(20),
      supabase.from("concept_states").select("concept_code,scaffold_level,evidence_count,independent_success_count").order("last_seen_at", { ascending: false })
    ]);
    sessions = (sessionResult.data ?? []) as SessionRow[];
    concepts = (conceptResult.data ?? []) as ConceptRow[];
  }

  return <section className="history-page">
    <header><span className="eyebrow">나의 학습 기록</span><h1>도움보다 성장을<br />기록합니다</h1><p>내가 직접 해결한 부분과 도움을 받아 해결한 부분을 함께 살펴보세요.</p></header>
    {!supabase && <div className="notice-card"><p>Supabase를 연결하면 학습 기록이 여기에 계속 보관됩니다.</p></div>}
    {supabase && !auth.user && <div className="notice-card"><p>내 학습 기록을 보려면 로그인이 필요합니다.</p><Link href="/login">로그인하기</Link></div>}
    {auth.user && <div className="history-grid">
      <section><h2>개념별 성장</h2>{concepts.length === 0 ? <p className="history-empty">아직 쌓인 학습 근거가 없습니다.</p> : <div className="concept-progress-grid">{concepts.map((item) => <article key={item.concept_code}><span>{activityLabels[item.concept_code] ?? item.concept_code}</span><strong>{item.independent_success_count}/{item.evidence_count}</strong><small>독립 성공 / 전체 근거</small><p>현재 도움: {scaffoldLabel(item.scaffold_level)}</p></article>)}</div>}</section>
      <section><h2>최근 학습</h2>{sessions.length === 0 ? <p className="history-empty">학습을 시작하면 최근 활동이 표시됩니다.</p> : <ol className="session-list">{sessions.map((item) => <li key={item.id}><div><strong>{activityLabels[item.activity_type] ?? item.activity_type}</strong><small>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.updated_at))}</small></div><span>{item.status === "completed" ? "완료" : "진행 중"}</span></li>)}</ol>}</section>
    </div>}
  </section>;
}
