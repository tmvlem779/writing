import Link from "next/link";
import { TeacherClassDashboard, type TeacherClassView } from "@/components/teacher-class-dashboard";
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

export const dynamic = "force-dynamic";

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
      const visibleClasses: ClassRow[] = (classMemberships ?? []).flatMap((row: { classes: unknown }) => {
        const value = row.classes as unknown;
        if (!value) return [];
        return Array.isArray(value) ? (value as ClassRow[]) : [value as ClassRow];
      });
      classes = visibleClasses.sort((a: ClassRow, b: ClassRow) => {
        if (a.name === b.name) return 0;
        if (a.name === "문법학급") return -1;
        if (b.name === "문법학급") return 1;
        return a.name.localeCompare(b.name, "ko");
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
  const classViews: TeacherClassView[] = classes.map((item) => {
    const studentMemberships = memberships.filter((membership) => membership.class_id === item.id);
    return {
      id: item.id,
      name: item.name,
      students: studentMemberships.map((membership) => ({
        userId: membership.user_id,
        alias: aliasByUser.get(membership.user_id) ?? "학생",
        loginId: loginIdByUser.get(membership.user_id) ?? "아이디 미확인",
        status: membership.status,
        createdAt: membership.created_at
      })),
      monitors: studentMemberships
        .map((membership) => monitorByUser.get(membership.user_id))
        .filter((monitor): monitor is StudentLearningMonitorData => Boolean(monitor))
    };
  });

  return (
    <section className="teacher-shell">
      <header className="teacher-header">
        <div><span className="eyebrow">교사 화면</span><h1>학생의 답보다<br />학습 과정을 봅니다</h1></div>
        <p>독립 해결, 도움 사용, 수정 근거와 전이 활동을 함께 확인합니다.</p>
      </header>

      {!configured && <div className="notice-card"><strong>개발 환경 안내</strong><p>Supabase 환경 변수를 연결하면 실제 학급과 학생 기록이 표시됩니다.</p></div>}
      {configured && !signedIn && <div className="notice-card"><p>교사 계정 로그인이 필요합니다.</p><Link href="/login">로그인하기</Link></div>}

      <TeacherClassDashboard canCreate={configured && signedIn} classes={classViews} />
    </section>
  );
}
