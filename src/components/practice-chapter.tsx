"use client";

import { useMemo, useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { Activity, AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getCourseLesson, getCourseTrack, type CourseLessonNumber, type CourseTrackId } from "@/lib/curriculum/five-lesson-course";

type Message = { role: "student" | "assistant"; content: string };
type SupportMode = "submit" | "hint";

type PracticeChapterProps = {
  initialActivityId?: string | null;
  initialCompletedActivityIds?: string[];
  lessonNumber: CourseLessonNumber;
  onProgressChange?: (completedActivityIds: string[], activeActivityId: string) => void;
  trackId: CourseTrackId;
};

const completionCriteria: Record<Activity, string> = {
  diagnose: "요구된 문장 요소를 찾고, 답을 판단한 눈에 보이는 단서를 한 가지 설명했다.",
  create: "조건에 맞는 문장을 학생이 직접 만들고, 사용한 문장 구조를 확인했다.",
  expand: "조건에 맞게 문장을 직접 확장하고 덧붙인 부분을 확인했다.",
  compare: "비교 대상의 차이를 찾고 그 차이가 뜻에 미치는 영향을 한 가지 설명했다.",
  error: "요구된 부분을 학생이 직접 고쳐 쓰고 바꾼 까닭을 한 가지 설명했다.",
  transfer: "배운 원리를 새 문장이나 상황에 직접 적용하고 사용한 단서를 확인했다.",
  reflect: "현재 과제의 답과 그 근거를 한 가지 설명했다.",
  authentic: "자료에서 근거를 찾고 자료의 목적이나 표현 효과를 한 가지 설명했다."
};

function criterionForActivity(activity: Activity) {
  return completionCriteria[activity];
}

export function PracticeChapter({
  initialActivityId,
  initialCompletedActivityIds = [],
  lessonNumber,
  onProgressChange,
  trackId
}: PracticeChapterProps) {
  const lesson = getCourseLesson(lessonNumber, trackId);
  const track = getCourseTrack(trackId);
  const activities = lesson.practiceActivities;
  const [activityId, setActivityId] = useState(() => (
    activities.some((item) => item.id === initialActivityId) ? initialActivityId as string : activities[0].id
  ));
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [scaffoldLevel, setScaffoldLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>(() => (
    initialCompletedActivityIds.filter((id) => activities.some((item) => item.id === id))
  ));
  const [pendingAction, setPendingAction] = useState<SupportMode | null>(null);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  const selected = useMemo(() => activities.find((item) => item.id === activityId) ?? activities[0], [activities, activityId]);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const result = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity: selected.activity, learningArea: "challenge" })
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error ?? "세션을 시작할 수 없습니다.");
    setSessionId(body.id);
    setDemo(Boolean(body.demo));
    return body.id as string;
  }

  async function sendTurn(supportMode: SupportMode) {
    if ((supportMode === "submit" && !draft.trim()) || pendingAction) return;
    setPendingAction(supportMode);
    setError("");
    try {
      const id = await ensureSession();
      const submittedDraft = draft.trim();
      const studentMessage = [
        `[수업안] ${track.optionLabel} · ${track.title}`,
        `[수업 차시] ${lessonNumber}차시 · ${lesson.title}`,
        `[핵심 질문] ${lesson.keyQuestion}`,
        `[현재 과제] ${selected.prompt}`,
        `[활동 완료 기준] ${criterionForActivity(selected.activity)}`,
        `[요청 유형] ${supportMode === "hint" ? "AI 힌트" : "도움 없이 제출"}`,
        `[학생 답]\n${submittedDraft || "아직 답을 쓰지 않았습니다."}`
      ].join("\n\n");
      const requestedScaffoldLevel = supportMode === "hint" ? Math.min(4, scaffoldLevel + 1) : scaffoldLevel;
      const result = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          activity: selected.activity,
          message: studentMessage,
          supportMode,
          scaffoldLevel: requestedScaffoldLevel,
          attemptCount,
          history: history.slice(-4)
        })
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "응답을 불러오지 못했습니다.");
      const next = body as AgentResponse & { demo?: boolean };
      setResponse(next);
      setDemo((current) => current || Boolean(next.demo));
      setScaffoldLevel(next.scaffoldLevel);
      if (supportMode === "submit") setAttemptCount((count) => count + 1);
      if (next.activityComplete) {
        const nextCompleted = completedActivityIds.includes(selected.id)
          ? completedActivityIds
          : [...completedActivityIds, selected.id];
        setCompletedActivityIds(nextCompleted);
        onProgressChange?.(nextCompleted, selected.id);
      }
      setHistory((items) => [
        ...items,
        { role: "student", content: supportMode === "hint" ? `힌트 요청: ${submittedDraft || "작성 전"}` : submittedDraft },
        { role: "assistant", content: [next.studentMessage, next.question].filter(Boolean).join(" ") }
      ]);
      if (supportMode === "submit") setDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPendingAction(null);
    }
  }

  function changeActivity(nextId: string) {
    setActivityId(nextId);
    setResponse(null);
    setSessionId(null);
    setHistory([]);
    setAttemptCount(0);
    setScaffoldLevel(0);
    setDraft("");
    onProgressChange?.(completedActivityIds, nextId);
  }

  return (
    <div className="studio-shell practice-studio-shell">
      <aside className="activity-sidebar" aria-label={`${lessonNumber}차시 2장 학습 활동`}>
        <div className="sidebar-heading">
          <span>Chapter 02 · {lessonNumber}차시</span>
          <strong>{lesson.title}</strong>
        </div>
        {activities.map((item, index) => (
          <button
            aria-current={activityId === item.id ? "step" : undefined}
            className={`${activityId === item.id ? "activity-button active" : "activity-button"}${completedActivityIds.includes(item.id) ? " completed" : ""}`}
            key={item.id}
            onClick={() => changeActivity(item.id)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}{completedActivityIds.includes(item.id) && <i aria-label="완료">✓</i>}
          </button>
        ))}
      </aside>

      <section className="workspace" aria-busy={pendingAction !== null} aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">{lessonNumber}차시 · {selected.label}</span>
            <h1 id="workspace-title">생각을 먼저 적어 보세요</h1>
          </div>
          {demo && <span className="demo-badge">개발용 데모</span>}
        </header>

        <section className="lesson-question-card compact" aria-label={`${lessonNumber}차시 핵심 질문`}>
          <span>핵심 질문</span>
          <strong>{lesson.keyQuestion}</strong>
        </section>

        <div className="task-card">
          <span>이번 과제</span>
          <p>{selected.prompt}</p>
        </div>

        {response && (
          <article className="coach-card" aria-live="polite">
            <div className="coach-label"><span>AI 학습 도우미</span><small>{scaffoldLabel(response.scaffoldLevel)}</small></div>
            {!response.activityComplete && <p>{response.studentMessage}</p>}
            {response.activityComplete ? (
              <div className="activity-completion-card">
                <span>활동 완료</span>
                <strong>이번 과제에서 확인할 내용을 모두 익혔어요.</strong>
              </div>
            ) : (
              <div className="coach-question">
                <span>다음 생각</span>
                <strong>{response.question}</strong>
              </div>
            )}
            {response.focusConcepts.length > 0 && (
              <div className="concept-tags" aria-label="학습 초점">
                {response.focusConcepts.map((concept) => <span key={concept}>{concept}</span>)}
              </div>
            )}
          </article>
        )}

        {response?.activityComplete ? (
          <div className="completion-actions">
            {activities.findIndex((item) => item.id === selected.id) < activities.length - 1 ? (
              <button
                className="primary-button"
                onClick={() => changeActivity(activities[activities.findIndex((item) => item.id === selected.id) + 1].id)}
                type="button"
              >
                다음 활동으로
              </button>
            ) : <strong>이 차시의 쓰기와 성찰 활동을 마쳤어요.</strong>}
          </div>
        ) : (
          <>
            <label className="draft-label" htmlFor="student-draft">내 문장과 생각</label>
            <textarea
              key={activityId}
              id="student-draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="완벽하게 쓰려고 하지 않아도 괜찮아요. 먼저 생각나는 문장을 적어 보세요."
              maxLength={4000}
            />
            <div className="editor-footer">
              <span>{draft.length.toLocaleString()} / 4,000자</span>
              <div className="editor-actions" aria-label="답 제출과 도움 선택">
                <button
                  aria-busy={pendingAction === "hint"}
                  className="secondary-button hint-button"
                  disabled={pendingAction !== null}
                  onClick={() => sendTurn("hint")}
                  type="button"
                >
                  {pendingAction === "hint" ? <MondeukLoading compact /> : "AI 힌트"}
                </button>
                <button
                  aria-busy={pendingAction === "submit"}
                  className="primary-button"
                  disabled={pendingAction !== null || !draft.trim()}
                  onClick={() => sendTurn("submit")}
                  type="button"
                >
                  {pendingAction === "submit" ? <MondeukLoading compact /> : "제출"}
                </button>
              </div>
            </div>
          </>
        )}

        {error && <div className="error-panel" role="alert">{error}</div>}
      </section>

    </div>
  );
}
