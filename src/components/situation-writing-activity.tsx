"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getSituationScene, situationScenes, type SituationSceneId } from "@/lib/curriculum/situation-writing";

type Message = { role: "student" | "assistant"; content: string };

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
  const [pending, setPending] = useState(false);
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

  async function submit() {
    if (!draft.trim() || pending) return;
    setPending(true);
    setError("");

    try {
      const id = await ensureSession();
      const studentMessage = [
        "[스스로 유형 학습 · 상황으로 문장 만들기]",
        `[활동] ${scene.title}`,
        `[상황] ${scene.setting}`,
        `[문장 조건] ${scene.firstCondition}`,
        `[활용할 수 있는 말] ${scene.wordHints.join(" / ")}`,
        `[학습 초점] ${scene.focusConcepts.join(", ")}`,
        `[학생이 만든 문장]\n${draft}`
      ].join("\n\n");
      const result = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          activity: "create",
          message: studentMessage,
          scaffoldLevel,
          attemptCount,
          history: history.slice(-6)
        })
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "응답을 불러오지 못했습니다.");
      const next = body as AgentResponse;
      setResponse(next);
      setScaffoldLevel(next.scaffoldLevel);
      setAttemptCount((count) => count + 1);
      setHistory((items) => [
        ...items,
        { role: "student", content: draft },
        { role: "assistant", content: `${next.studentMessage} ${next.question}` }
      ]);
      await onDailyComplete?.(id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPending(false);
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

      <div className="situation-writing-workspace" aria-busy={pending}>
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
            <p>{response.studentMessage}</p>
            <div className="coach-question"><span>다음 생각</span><strong>{response.question}</strong></div>
          </article>
        )}

        <label className="draft-label" htmlFor="situation-sentence">내가 만든 문장</label>
        <textarea
          id="situation-sentence"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="주어진 상황을 바탕으로 먼저 한 문장을 만들어 보세요."
          maxLength={1000}
        />
        <div className="editor-footer">
          <span>{draft.length.toLocaleString()} / 1,000자</span>
          <button aria-busy={pending} className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
            {pending ? <MondeukLoading compact /> : response ? "고친 문장 다시 보내기" : "문장 보내고 질문 받기"}
          </button>
        </div>
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
