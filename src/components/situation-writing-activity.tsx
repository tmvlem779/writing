"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getSituationScene, situationScenes, type SituationSceneId } from "@/lib/curriculum/situation-writing";

type Message = { role: "student" | "assistant"; content: string };

function SituationIllustration({ sceneId }: { sceneId: SituationSceneId }) {
  const scene = getSituationScene(sceneId);

  return (
    <svg className={`situation-illustration scene-${sceneId}`} viewBox="0 0 640 360" role="img" aria-labelledby={`scene-${sceneId}-title scene-${sceneId}-description`}>
      <title id={`scene-${sceneId}-title`}>{scene.title}</title>
      <desc id={`scene-${sceneId}-description`}>{scene.illustrationLabel}</desc>
      <rect className="scene-sky" width="640" height="360" rx="28" />

      {sceneId === "rainy-gate" && (
        <>
          <path className="scene-building" d="M38 146h210v155H38zM64 111h158v35H64z" />
          <path className="scene-window" d="M72 178h45v44H72zM137 178h45v44h-45z" />
          <path className="scene-ground" d="M0 291h640v69H0z" />
          <path className="scene-accent" d="M300 170c35-55 124-55 159 0H300Z" />
          <path className="scene-line" d="M380 169v119M338 286c5-42 65-42 70 0M473 286c5-42 65-42 70 0" />
          <circle className="scene-person" cx="373" cy="203" r="24" />
          <circle className="scene-person secondary" cx="508" cy="203" r="24" />
          <path className="scene-line" d="M373 227v51M508 227v51M373 245l-34 23M508 245l-32 23" />
          <path className="scene-rain" d="M285 76l-12 25M340 47l-12 25M406 74l-12 25M482 48l-12 25M548 80l-12 25M590 44l-12 25" />
        </>
      )}

      {sceneId === "library-help" && (
        <>
          <path className="scene-building" d="M35 62h228v250H35zM377 62h228v250H377z" />
          <path className="scene-line thin" d="M58 106h182M58 159h182M58 212h182M58 265h182M400 106h182M400 159h182M400 212h182M400 265h182" />
          <path className="scene-books" d="M67 79h19v27H67zM91 72h21v34H91zM117 82h18v24h-18zM409 73h20v33h-20zM435 80h18v26h-18zM459 70h23v36h-23z" />
          <circle className="scene-person" cx="292" cy="163" r="26" />
          <circle className="scene-person secondary" cx="351" cy="160" r="26" />
          <path className="scene-line" d="M292 189v80M351 186v83M292 218l-39 13M351 211l42-36" />
          <path className="scene-accent" d="M246 221h64v42h-64z" />
          <path className="scene-ground" d="M0 309h640v51H0z" />
        </>
      )}

      {sceneId === "group-presentation" && (
        <>
          <path className="scene-building" d="M45 64h550v238H45z" />
          <circle className="scene-clock" cx="320" cy="109" r="38" />
          <path className="scene-line thin" d="M320 109V85M320 109l19 12" />
          <path className="scene-ground" d="M0 302h640v58H0z" />
          <path className="scene-table" d="M167 234h306l26 70H141l26-70Z" />
          <circle className="scene-person" cx="221" cy="183" r="28" />
          <circle className="scene-person secondary" cx="421" cy="181" r="28" />
          <path className="scene-line" d="M221 211v42M421 209v44M221 227l51 25M421 227l-48 25" />
          <path className="scene-accent" d="M272 214h82v51h-82z" />
          <path className="scene-line thin" d="M285 228h55M285 240h43M178 249h58M389 250h66" />
        </>
      )}
    </svg>
  );
}

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
      body: JSON.stringify({ activity: "create" })
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
        "[스스로 유형 학습 · 그림과 상황으로 문장 만들기]",
        `[장면] ${scene.title}`,
        `[상황] ${scene.setting}`,
        `[그림에서 확인 가능한 정보] ${scene.observations.join(" / ")}`,
        `[문장 조건] ${scene.firstCondition}`,
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
      <aside className="situation-scene-list" aria-label="그림 상황 선택">
        <div><span>그림·상황</span><strong>한 장면, 여러 문장</strong></div>
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
        <p>{dailyMode ? "오늘의 장면을 관찰하고 자신의 문장을 먼저 만든 뒤 질문을 받아요." : "정답 문장을 따라 쓰지 않고, 그림에서 관찰한 사실로 자신의 문장을 먼저 만듭니다."}</p>
      </aside>

      <div className="situation-writing-workspace" aria-busy={pending}>
        <header>
          <div><span>관찰 → 생성 → 질문 → 고쳐쓰기</span><h1 id="situation-writing-title">{scene.title}</h1></div>
          <strong>{attemptCount}회 생각 확장</strong>
        </header>

        <figure className="situation-figure">
          <SituationIllustration sceneId={scene.id} />
          <figcaption>{scene.illustrationLabel}</figcaption>
        </figure>

        <section className="situation-observation" aria-label="관찰 도움">
          <div><span>상황</span><p>{scene.setting}</p></div>
          <details>
            <summary>그림 관찰 단서 보기</summary>
            <ul>{scene.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul>
          </details>
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
          placeholder="그림에서 실제로 확인한 내용으로 먼저 한 문장을 만들어 보세요."
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
