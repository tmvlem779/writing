"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getSituationScene, sentenceBuildingQuestions, situationScenes, type SituationSceneId } from "@/lib/curriculum/situation-writing";

type Message = { role: "student" | "assistant"; content: string };
type SupportMode = "submit" | "hint";
type PreviousStageSentence = { content: string; source: "student" | "example" };

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
  const [learningQuestionCount, setLearningQuestionCount] = useState(0);
  const [previousStageSentence, setPreviousStageSentence] = useState<PreviousStageSentence | null>(null);
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
      const currentCoreQuestion = sentenceBuildingQuestions[Math.min(learningQuestionCount, sentenceBuildingQuestions.length - 1)];
      const currentQuestion = response?.question || currentCoreQuestion;
      const studentMessage = [
        "[스스로 유형 학습 · 상황으로 문장 만들기]",
        `[활동] ${scene.title}`,
        `[상황] ${scene.setting}`,
        `[문장 조건] ${currentCoreQuestion}`,
        previousStageSentence
          ? `[이전 단계에서 ${previousStageSentence.source === "student" ? "제출한 학생 문장" : "확인한 예시 문장"}]\n${previousStageSentence.content}`
          : null,
        `[학습 초점] ${scene.focusConcepts.join(", ")}`,
        `[학습 질문 진행] ${learningQuestionCount}/${sentenceBuildingQuestions.length}`,
        `[현재 핵심 질문] ${currentCoreQuestion}`,
        `[네 가지 핵심 질문]\n${sentenceBuildingQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")}`,
        "[튜터 응답 원칙] 현재 단계의 조건을 정확히 충족한 문장만 다음 단계로 이동할 것. 일부만 충족하거나 잘못 만든 문장에는 단계 수를 늘리지 말고, 잘된 점 한 가지와 고칠 지점 한 가지만 짚은 뒤 현재 조건을 더 쉽게 묻는 보조 질문 하나를 제시할 것. 보조 질문은 네 가지 핵심 질문에 포함하지 않는다.",
        "[활동 완료 기준] 주어와 서술어가 드러나는 기본 문장을 만든 뒤 부속 성분과 절·연결 표현을 차례로 더하고, 주어·서술어 호응과 상황 적절성을 점검한 최종 문장을 완성했다.",
        `[요청 유형] ${supportMode === "hint" ? "AI 힌트" : "도움 없이 제출"}`,
        `[학생이 만든 문장]\n${submittedDraft || "아직 답을 쓰지 않았습니다."}`
      ].filter(Boolean).join("\n\n");
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
      const rawNext = body as AgentResponse;
      const continuesSameQuestion = rawNext.questionResolution === "continue";
      const nextQuestionAttemptCount = continuesSameQuestion
        && supportMode === "submit"
        && (rawNext.answerStatus === "incorrect" || rawNext.answerStatus === "partial" || rawNext.answerStatus === "not_answered")
        ? Math.min(20, questionAttemptCount + 1)
        : continuesSameQuestion ? questionAttemptCount : 0;
      const nextQuestionHintCount = continuesSameQuestion && supportMode === "hint"
        ? Math.min(20, questionHintCount + 1)
        : continuesSameQuestion ? questionHintCount : 0;
      const acceptedLearningQuestion = rawNext.questionResolution === "reveal_and_advance"
        || (supportMode === "submit" && (rawNext.questionResolution === "advance" || rawNext.questionResolution === "complete"));
      const nextLearningQuestionCount = acceptedLearningQuestion
        ? Math.min(sentenceBuildingQuestions.length, learningQuestionCount + 1)
        : learningQuestionCount;
      const next = acceptedLearningQuestion
        && !rawNext.activityComplete
        && nextLearningQuestionCount < sentenceBuildingQuestions.length
        ? { ...rawNext, question: sentenceBuildingQuestions[nextLearningQuestionCount] }
        : rawNext;
      const acceptedSentence = rawNext.questionResolution === "reveal_and_advance"
        ? rawNext.resolvedQuestionAnswer.trim()
        : submittedDraft;
      setResponse(next);
      setScaffoldLevel(next.scaffoldLevel);
      setAttemptCount((count) => count + 1);
      setQuestionAttemptCount(nextQuestionAttemptCount);
      setQuestionHintCount(nextQuestionHintCount);
      setLearningQuestionCount(nextLearningQuestionCount);
      if (acceptedLearningQuestion && acceptedSentence) {
        setPreviousStageSentence({
          content: acceptedSentence,
          source: rawNext.questionResolution === "reveal_and_advance" ? "example" : "student"
        });
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
    setLearningQuestionCount(0);
    setPreviousStageSentence(null);
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
          <div><span>기본 문장 → 성분 추가 → 절 추가 → 최종 점검</span><h1 id="situation-writing-title">{scene.title}</h1></div>
          <strong>{Math.min(learningQuestionCount + 1, sentenceBuildingQuestions.length)} / {sentenceBuildingQuestions.length}단계</strong>
        </header>

        <section className="situation-prompt" aria-label="문장을 만들 상황">
          <span>상황</span>
          <p>{scene.setting}</p>
        </section>

        <section className="situation-condition">
          <span>첫 문장 조건</span>
          <strong>{scene.firstCondition}</strong>
        </section>

        {learningQuestionCount > 0 && previousStageSentence && (
          <section className="situation-previous-sentence" aria-label="이전 단계 문장">
            <span>{previousStageSentence.source === "student" ? "이전 단계에서 제출한 내 문장" : "이전 단계에서 확인한 예시 문장"}</span>
            <p>{previousStageSentence.content}</p>
          </section>
        )}

        {response && (
          <article className="coach-card situation-coach" aria-live="polite">
            <div className="coach-label"><span>AI 학습 도우미</span><small>{scaffoldLabel(response.scaffoldLevel)}</small></div>
            {response.questionResolution === "reveal_and_advance" ? (
              <div className="activity-resolution-card">
                <span>이 단계의 답 확인</span>
                <strong>{response.resolvedQuestionAnswer}</strong>
                <p>{response.activityComplete ? "네 단계 활동을 여기서 마칠게요." : "이 단계는 여기서 마치고 다음 문장 확장 단계로 넘어갈게요."}</p>
              </div>
            ) : response.activityComplete ? (
              <div className="activity-completion-card">
                <span>활동 완료</span>
                <strong>조건을 하나씩 더해 긴 문장을 만들고 최종 점검까지 마쳤어요.</strong>
              </div>
            ) : (
              <>
                <p>{response.studentMessage}</p>
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
              placeholder={previousStageSentence ? "위 문장에 현재 단계의 조건을 더해 다시 써 보세요." : response ? "새 질문에 대한 문장이나 설명을 적어 보세요." : "주어진 상황을 바탕으로 먼저 한 문장을 만들어 보세요."}
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
        <p>AI는 문장을 단계별로 점검하고, 조건이 부족하면 쉬운 질문과 피드백을 준 뒤 다음 확장 단계로 안내합니다.</p>
      </aside>
    </section>
  );
}
