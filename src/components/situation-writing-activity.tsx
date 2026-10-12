"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getSituationScene, situationScenes, type SituationSceneId } from "@/lib/curriculum/situation-writing";

type Message = { role: "student" | "assistant"; content: string };
type SupportMode = "submit" | "hint";

type SituationWritingActivityProps = {
  initialSceneId?: SituationSceneId;
  dailyMode?: boolean;
  onDailyComplete?: (sessionId: string) => void | Promise<void>;
};

export function SituationWritingActivity({
  initialSceneId = situationScenes[0].id,
  dailyMode = false,
  onDailyComplete
}: SituationWritingActivityProps = {}) {
  const [sceneId, setSceneId] = useState<SituationSceneId>(initialSceneId);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [scaffoldLevel, setScaffoldLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [questionAttemptCount, setQuestionAttemptCount] = useState(0);
  const [questionHintCount, setQuestionHintCount] = useState(0);
  const [pendingAction, setPendingAction] = useState<SupportMode | null>(null);
  const [error, setError] = useState("");
  const scene = getSituationScene(sceneId);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const result = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity: "create", learningArea: "self-study" })
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error ?? "학습을 시작할 수 없습니다.");
    setSessionId(body.id);
    return body.id as string;
  }

  async function sendTurn(supportMode: SupportMode) {
    if ((supportMode === "submit" && !draft.trim()) || pendingAction) return;
    setPendingAction(supportMode);
    setError("");

    try {
      const id = await ensureSession();
      const submittedDraft = draft.trim();
      const currentQuestion = response?.question || scene.firstCondition;
      const studentMessage = [
        "[스스로 유형 학습 · 상황으로 문장 만들기]",
        `[활동] ${scene.title}`,
        `[상황] ${scene.setting}`,
        `[문장 조건] ${scene.firstCondition}`,
        `[활용할 수 있는 말] ${scene.wordHints.join(" / ")}`,
        `[학습 초점] ${scene.focusConcepts.join(", ")}`,
        "[활동 완료 기준] 상황과 첫 문장 조건을 충족하는 문장을 직접 만들고, 처음 문장과 고친 문장에서 달라진 구조·의미·상황 적절성 중 한 가지를 비교하여 설명했다.",
        `[요청 유형] ${supportMode === "hint" ? "AI 힌트" : "도움 없이 제출"}`,
        `[학생이 만든 문장]\n${submittedDraft || "아직 답을 쓰지 않았습니다."}`
      ].join("\n\n");
      const requestedScaffoldLevel = supportMode === "hint" ? Math.min(4, scaffoldLevel + 1) : scaffoldLevel;
      const result = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          activity: "create",
          message: studentMessage,
          supportMode,
          scaffoldLevel: requestedScaffoldLevel,
          attemptCount,
          currentQuestion,
          questionAttemptCount,
          questionHintCount,
          history: history.slice(-6)
        })
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "응답을 불러오지 못했습니다.");
      const next = body as AgentResponse;
      setResponse(next);
      setScaffoldLevel(next.scaffoldLevel);
      setAttemptCount((count) => count + 1);
      if (next.questionResolution === "continue" && next.question === currentQuestion) {
        if (supportMode === "hint") setQuestionHintCount((count) => count + 1);
        if (supportMode === "submit" && (next.answerStatus === "incorrect" || next.answerStatus === "partial")) {
          setQuestionAttemptCount((count) => count + 1);
        }
      } else {
        setQuestionAttemptCount(0);
        setQuestionHintCount(0);
      }
      setHistory((items) => [
        ...items,
        { role: "student", content: supportMode === "hint" ? `힌트 요청: ${submittedDraft || "작성 전"}` : submittedDraft },
        { role: "assistant", content: [next.studentMessage, next.resolvedQuestionAnswer, next.question].filter(Boolean).join(" ") }
      ]);
      if (next.question !== currentQuestion || next.activityComplete) setDraft("");
      if (supportMode === "submit" && next.activityComplete) await onDailyComplete?.(id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPendingAction(null);
    }
  }

  function selectScene(nextSceneId: SituationSceneId) {
    setSceneId(nextSceneId);
    setDraft("");
    setSessionId(null);
    setResponse(null);
    setHistory([]);
    setScaffoldLevel(0);
    setAttemptCount(0);
    setQuestionAttemptCount(0);
    setQuestionHintCount(0);
    setError("");
  }

  return (
    <section className="situation-writing-shell" aria-labelledby="situation-writing-title">
      <aside className="situation-scene-list" aria-label="문장 만들기 상황 선택">
        <div><span>상황 문장</span><strong>한 상황, 여러 문장</strong></div>
        {(dailyMode ? situationScenes.filter((item) => item.id === initialSceneId) : situationScenes).map((item) => (
          <button
            aria-current={sceneId === item.id ? "step" : undefined}
            className={sceneId === item.id ? "active" : ""}
            key={item.id}
            onClick={() => selectScene(item.id)}
            type="button"
          >
            <span>{String(item.order).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
        <p>{dailyMode ? "오늘의 상황을 읽고 자신의 문장을 먼저 만든 뒤 질문을 받아요." : "정답 문장을 따라 쓰지 않고, 주어진 상황으로 자신의 문장을 먼저 만듭니다."}</p>
      </aside>

      <div className="situation-writing-workspace" aria-busy={pendingAction !== null}>
        <header>
          <div><span>상황 읽기 → 생성 → 질문 → 고쳐쓰기</span><h1 id="situation-writing-title">{scene.title}</h1></div>
          <strong>{attemptCount}회 생각 확장</strong>
        </header>

        <section className="situation-prompt" aria-label="문장을 만들 상황">
          <span>상황</span>
          <p>{scene.setting}</p>
        </section>

        <section className="situation-condition">
          <span>첫 문장 조건</span>
          <strong>{scene.firstCondition}</strong>
          <div aria-label="활용할 수 있는 말">{scene.wordHints.map((hint) => <span key={hint}>{hint}</span>)}</div>
        </section>

        {response && (
          <article className="coach-card situation-coach" aria-live="polite">
            <div className="coach-label"><span>AI 학습 도우미</span><small>{scaffoldLabel(response.scaffoldLevel)}</small></div>
            {response.activityComplete ? (
              <div className="activity-completion-card">
                <span>활동 완료</span>
                <strong>상황에 맞는 문장을 만들고 바뀐 점까지 설명했어요.</strong>
              </div>
            ) : (
              <>
                {response.questionResolution === "reveal_and_advance" ? (
                  <div className="activity-resolution-card">
                    <span>이 질문의 정답 확인</span>
                    <strong>{response.resolvedQuestionAnswer}</strong>
                    <p>이 질문은 여기서 마치고 다음 질문으로 이어갈게요.</p>
                  </div>
                ) : <p>{response.studentMessage}</p>}
                <div className="coach-question"><span>다음 생각</span><strong>{response.question}</strong></div>
              </>
            )}
          </article>
        )}

        {!response?.activityComplete && (
          <>
            <label className="draft-label" htmlFor="situation-sentence">내가 만든 문장</label>
            <textarea
              id="situation-sentence"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={response ? "새 질문에 대한 문장이나 설명을 적어 보세요." : "주어진 상황을 바탕으로 먼저 한 문장을 만들어 보세요."}
              maxLength={1000}
            />
            <div className="editor-footer">
              <span>{draft.length.toLocaleString()} / 1,000자</span>
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
      </div>

      <aside className="situation-learning-guide" aria-label="현재 학습 초점">
        <span>현재 학습 초점</span>
        <h2>문장을 만들며 발견해요</h2>
        <div>{scene.focusConcepts.map((concept) => <span key={concept}>{concept}</span>)}</div>
        <p>AI는 완성 답안을 먼저 주지 않고, 내가 만든 문장을 바탕으로 질문과 단서를 한 단계씩 제공합니다.</p>
      </aside>
    </section>
  );
}
