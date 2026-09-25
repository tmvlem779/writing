import Link from "next/link";
import { InviteForm } from "@/components/invite-form";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ClassRow = { id: string; name: string };
type MembershipRow = { class_id: string; user_id: string; status: "invited" | "active" };
type ProfileRow = { user_id: string; display_alias: string };
type SessionRow = { id: string; user_id: string; activity_type: string; updated_at: string };
type ConceptRow = { user_id: string; scaffold_level: number; evidence_count: number; independent_success_count: number };
type StudentSummary = {
  userId: string;
  alias: string;
  sessionCount: number;
  lastActivity: string | null;
  lastSeenAt: string | null;
  maxScaffoldLevel: number;
  evidenceCount: number;
  independentSuccessCount: number;
};

const activityLabels: Record<string, string> = {
  diagnose: "시작 진단", create: "문장 만들기", expand: "문장 확장", compare: "구조 비교",
  error: "오류 탐구", transfer: "짧은 글쓰기", reflect: "성찰", authentic: "실생활 자료"
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "아직 활동 없음";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function TeacherPage() {
  const supabase = await createServerSupabaseClient();
  let classes: ClassRow[] = [];
  let memberships: MembershipRow[] = [];
  let profiles: ProfileRow[] = [];
  let sessions: SessionRow[] = [];
  let concepts: ConceptRow[] = [];
  const configured = Boolean(supabase);
  let signedIn = false;

  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    signedIn = Boolean(auth.user);
    if (auth.user) {
      const { data: classMemberships } = await supabase.from("class_memberships").select("classes(id,name)")
        .eq("user_id", auth.user.id).eq("role", "teacher").eq("status", "active");
      classes = (classMemberships ?? []).flatMap((row) => {
        const value = row.classes as unknown;
        if (!value) return [];
        return Array.isArray(value) ? (value as ClassRow[]) : [value as ClassRow];
      });

      const classIds = classes.map((item) => item.id);
      if (classIds.length > 0) {
        const { data } = await supabase.from("class_memberships").select("class_id,user_id,status")
          .in("class_id", classIds).eq("role", "student").in("status", ["invited", "active"]);
        memberships = (data ?? []) as MembershipRow[];
      }

      const studentIds = [...new Set(memberships.map((item) => item.user_id))];
      if (studentIds.length > 0) {
        const [profileResult, sessionResult, conceptResult] = await Promise.all([
          supabase.from("profiles").select("user_id,display_alias").in("user_id", studentIds),
          supabase.from("learning_sessions").select("id,user_id,activity_type,updated_at").in("user_id", studentIds).order("updated_at", { ascending: false }),
          supabase.from("concept_states").select("user_id,scaffold_level,evidence_count,independent_success_count").in("user_id", studentIds)
        ]);
        profiles = (profileResult.data ?? []) as ProfileRow[];
        sessions = (sessionResult.data ?? []) as SessionRow[];
        concepts = (conceptResult.data ?? []) as ConceptRow[];
      }
    }
  }

  const aliasByUser = new Map(profiles.map((item) => [item.user_id, item.display_alias]));
  const summaryByUser = new Map<string, StudentSummary>();
  for (const membership of memberships) {
    const studentSessions = sessions.filter((item) => item.user_id === membership.user_id);
    const studentConcepts = concepts.filter((item) => item.user_id === membership.user_id);
    const latest = studentSessions[0];
    summaryByUser.set(membership.user_id, {
      userId: membership.user_id,
      alias: aliasByUser.get(membership.user_id) ?? "학생",
      sessionCount: studentSessions.length,
      lastActivity: latest?.activity_type ?? null,
      lastSeenAt: latest?.updated_at ?? null,
      maxScaffoldLevel: studentConcepts.reduce((max, item) => Math.max(max, item.scaffold_level), 0),
      evidenceCount: studentConcepts.reduce((sum, item) => sum + item.evidence_count, 0),
      independentSuccessCount: studentConcepts.reduce((sum, item) => sum + item.independent_success_count, 0)
    });
  }
  const summaries = [...summaryByUser.values()];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayActivities = sessions.filter((item) => new Date(item.updated_at) >= today).length;
  const studentsNeedingHelp = summaries.filter((item) => item.maxScaffoldLevel >= 3).length;

  return (
    <section className="teacher-shell">
      <header className="teacher-header">
        <div><span className="eyebrow">교사 화면</span><h1>학생의 답보다<br />학습 과정을 봅니다</h1></div>
        <p>독립 해결, 도움 사용, 수정 근거와 전이 활동을 함께 확인합니다.</p>
      </header>

      {!configured && <div className="notice-card"><strong>개발 환경 안내</strong><p>Supabase 환경 변수를 연결하면 실제 학급과 학생 기록이 표시됩니다.</p></div>}
      {configured && !signedIn && <div className="notice-card"><p>교사 계정 로그인이 필요합니다.</p><Link href="/login">로그인하기</Link></div>}

      <div className="metric-grid">
        <article><span>등록 학급</span><strong>{classes.length}</strong><small>담당 중인 수업</small></article>
        <article><span>오늘 활동</span><strong>{configured && signedIn ? todayActivities : "—"}</strong><small>오늘 갱신된 세션</small></article>
        <article><span>도움 필요</span><strong>{configured && signedIn ? studentsNeedingHelp : "—"}</strong><small>부분 구조 이상 비계 사용</small></article>
      </div>

      <section className="teacher-section">
        <div className="section-title-row"><div><span>내 학급</span><h2>수업별 학습 현황</h2></div></div>
        {classes.length === 0 ? (
          <div className="empty-state"><strong>표시할 학급이 없습니다.</strong><p>Supabase에서 교사 계정과 학급을 연결하면 여기에 나타납니다.</p></div>
        ) : (
          <div className="class-grid">
            {classes.map((item) => {
              const students = memberships.filter((membership) => membership.class_id === item.id)
                .map((membership) => summaryByUser.get(membership.user_id)).filter((summary): summary is StudentSummary => Boolean(summary));
              return <article className="class-card" key={item.id}>
                <span>진행 중 · 학생 {students.length}명</span><h3>{item.name}</h3>
                {students.length === 0 ? <p>등록된 학생의 활동이 아직 없습니다.</p> : <div className="student-progress-list">
                  {students.map((student) => <div className="student-progress" key={student.userId}>
                    <div><strong>{student.alias}</strong><small>{student.lastActivity ? activityLabels[student.lastActivity] : "미시작"} · {formatDate(student.lastSeenAt)}</small></div>
                    <dl>
                      <div><dt>세션</dt><dd>{student.sessionCount}</dd></div>
                      <div><dt>독립 성공</dt><dd>{student.independentSuccessCount}/{student.evidenceCount}</dd></div>
                      <div><dt>최대 도움</dt><dd>{scaffoldLabel(student.maxScaffoldLevel)}</dd></div>
                    </dl>
                  </div>)}
                </div>}
                <InviteForm classId={item.id} />
              </article>;
            })}
          </div>
        )}
      </section>
    </section>
  );
}
