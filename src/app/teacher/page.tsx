import Link from "next/link";
import { InviteForm } from "@/components/invite-form";
import { StudentLearningMonitor } from "@/components/student-learning-monitor";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildStudentLearningMonitor, type StudentLearningMonitor as StudentLearningMonitorData } from "@/lib/teacher/learning-monitor";

type ClassRow = { id: string; name: string };
type MembershipRow = { class_id: string; user_id: string; status: "invited" | "active"; created_at: string };
type ProfileRow = { user_id: string; display_alias: string };
type SessionRow = { id: string; user_id: string; activity_type: string; status: string; updated_at: string };
type ConceptRow = { user_id: string; concept_code: string; scaffold_level: number; evidence_count: number; independent_success_count: number };
type LearningEventRow = { user_id: string; session_id: string; event_type: string; concept_code: string | null; metadata: unknown; created_at: string };
type WrongAnswerRow = { user_id: string; source: "diagnosis" | "challenge" | "self-study"; source_label: string; problem_title: string; question: string; submitted_answer: string; feedback_hint: string; attempt_count: number; resolved_at: string | null; updated_at: string };
type ChallengeProgressRow = { user_id: string; lesson_number: number; concept_completed: boolean; completed_activity_ids: string[]; updated_at: string };
type AccountIdentity = { userId: string; loginId: string };
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

export const dynamic = "force-dynamic";

function formatRegistrationDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export default async function TeacherPage() {
  const supabase = await createServerSupabaseClient();
  let classes: ClassRow[] = [];
  let memberships: MembershipRow[] = [];
  let profiles: ProfileRow[] = [];
  let sessions: SessionRow[] = [];
  let concepts: ConceptRow[] = [];
  let learningEvents: LearningEventRow[] = [];
  let wrongAnswers: WrongAnswerRow[] = [];
  let challengeProgress: ChallengeProgressRow[] = [];
  let accountIdentities: AccountIdentity[] = [];
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
        const { data } = await supabase.from("class_memberships").select("class_id,user_id,status,created_at")
          .in("class_id", classIds).eq("role", "student").in("status", ["invited", "active"])
          .order("created_at", { ascending: true });
        memberships = (data ?? []) as MembershipRow[];
      }

      const studentIds = [...new Set(memberships.map((item) => item.user_id))];
      if (studentIds.length > 0) {
        const [profileResult, sessionResult, conceptResult, eventResult, wrongAnswerResult, challengeProgressResult] = await Promise.all([
          supabase.from("profiles").select("user_id,display_alias").in("user_id", studentIds),
          supabase.from("learning_sessions").select("id,user_id,activity_type,status,updated_at").in("user_id", studentIds).order("updated_at", { ascending: false }),
          supabase.from("concept_states").select("user_id,concept_code,scaffold_level,evidence_count,independent_success_count").in("user_id", studentIds),
          supabase.from("learning_events").select("user_id,session_id,event_type,concept_code,metadata,created_at").in("user_id", studentIds).order("created_at", { ascending: false }).limit(1000),
          supabase.from("wrong_answers").select("user_id,source,source_label,problem_title,question,submitted_answer,feedback_hint,attempt_count,resolved_at,updated_at").in("user_id", studentIds).order("updated_at", { ascending: false }).limit(1000),
          supabase.from("challenge_progress").select("user_id,lesson_number,concept_completed,completed_activity_ids,updated_at").in("user_id", studentIds).eq("track_id", "grammar")
        ]);
        profiles = (profileResult.data ?? []) as ProfileRow[];
        sessions = (sessionResult.data ?? []) as SessionRow[];
        concepts = (conceptResult.data ?? []) as ConceptRow[];
        learningEvents = (eventResult.data ?? []) as LearningEventRow[];
        wrongAnswers = (wrongAnswerResult.data ?? []) as WrongAnswerRow[];
        challengeProgress = (challengeProgressResult.data ?? []) as ChallengeProgressRow[];

        const admin = createAdminSupabaseClient();
        if (admin) {
          accountIdentities = (await Promise.all(studentIds.map(async (userId) => {
            const { data } = await admin.auth.admin.getUserById(userId);
            const metadataLoginId = data.user?.user_metadata?.login_id;
            const internalEmail = data.user?.email?.endsWith("@accounts.mundeuk.invalid") ? data.user.email.split("@")[0] : null;
            const loginId = typeof metadataLoginId === "string" ? metadataLoginId : internalEmail;
            return loginId ? { userId, loginId } : null;
          }))).filter((item): item is AccountIdentity => Boolean(item));
        }
      }
    }
  }

  const aliasByUser = new Map(profiles.map((item) => [item.user_id, item.display_alias]));
  const loginIdByUser = new Map(accountIdentities.map((item) => [item.userId, item.loginId]));
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
  const monitorByUser = new Map<string, StudentLearningMonitorData>();
  for (const membership of memberships) {
    const userId = membership.user_id;
    monitorByUser.set(userId, buildStudentLearningMonitor({
      userId,
      name: aliasByUser.get(userId) ?? "학생",
      loginId: loginIdByUser.get(userId) ?? aliasByUser.get(userId) ?? "아이디 미확인",
      sessions: sessions.filter((item) => item.user_id === userId).map((item) => ({
        id: item.id,
        activityType: item.activity_type,
        status: item.status,
        updatedAt: item.updated_at
      })),
      concepts: concepts.filter((item) => item.user_id === userId).map((item) => ({
        conceptCode: item.concept_code,
        scaffoldLevel: item.scaffold_level,
        evidenceCount: item.evidence_count,
        independentSuccessCount: item.independent_success_count
      })),
      events: learningEvents.filter((item) => item.user_id === userId).map((item) => ({
        sessionId: item.session_id,
        eventType: item.event_type,
        conceptCode: item.concept_code,
        metadata: item.metadata,
        createdAt: item.created_at
      })),
      wrongAnswers: wrongAnswers.filter((item) => item.user_id === userId).map((item) => ({
        source: item.source,
        sourceLabel: item.source_label,
        problemTitle: item.problem_title,
        question: item.question,
        submittedAnswer: item.submitted_answer,
        feedbackHint: item.feedback_hint,
        attemptCount: item.attempt_count,
        resolvedAt: item.resolved_at,
        updatedAt: item.updated_at
      })),
      challengeProgress: challengeProgress.filter((item) => item.user_id === userId).map((item) => ({
        lessonNumber: item.lesson_number,
        conceptCompleted: item.concept_completed,
        completedActivityIds: item.completed_activity_ids,
        updatedAt: item.updated_at
      }))
    }));
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
              const studentMemberships = memberships.filter((membership) => membership.class_id === item.id);
              const students = studentMemberships
                .map((membership) => summaryByUser.get(membership.user_id)).filter((summary): summary is StudentSummary => Boolean(summary));
              const studentMonitors = studentMemberships
                .map((membership) => monitorByUser.get(membership.user_id)).filter((monitor): monitor is StudentLearningMonitorData => Boolean(monitor));
              return <article className="class-card" key={item.id}>
                <span>진행 중 · 학생 {students.length}명</span><h3>{item.name}</h3>
                <section className="student-account-section" aria-labelledby={`student-accounts-${item.id}`}>
                  <div className="student-account-heading">
                    <div><span>계정 관리</span><h4 id={`student-accounts-${item.id}`}>학생 계정 목록</h4></div>
                    <strong>{studentMemberships.length}명</strong>
                  </div>
                  {studentMemberships.length === 0 ? <p className="student-account-empty">아직 만든 학생 계정이 없습니다.</p> : <ol className="student-account-list">
                    {studentMemberships.map((membership, index) => <li key={membership.user_id}>
                      <span className="student-account-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{aliasByUser.get(membership.user_id) ?? "학생"}</strong><small>{loginIdByUser.get(membership.user_id) ?? "아이디 미확인"}</small></div>
                      <span className={`student-account-status ${membership.status}`}>{membership.status === "active" ? "사용 중" : "초대 중"}</span>
                      <time dateTime={membership.created_at}>{formatRegistrationDate(membership.created_at)} 등록</time>
                    </li>)}
                  </ol>}
                </section>
                <StudentLearningMonitor classId={item.id} students={studentMonitors} />
                <InviteForm classId={item.id} />
              </article>;
            })}
          </div>
        )}
      </section>
    </section>
  );
}
