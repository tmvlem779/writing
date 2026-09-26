"use client";

import { useState } from "react";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getCourseLesson, getCourseTrack, type CourseLessonNumber, type CourseTrackId } from "@/lib/curriculum/five-lesson-course";
import {
  buildRealLifeTask,
  getRealLifeLessonGuide,
  getRealLifeMaterialsForLesson,
  realLifePracticeModes,
  type RealLifePracticeMode
} from "@/lib/curriculum/real-life-materials";

type Message = { role: "student" | "assistant"; content: string };

type RealLifeChapterProps = {
  lessonNumber: CourseLessonNumber;
  trackId: CourseTrackId;
};

export function RealLifeChapter({ lessonNumber, trackId }: RealLifeChapterProps) {
  const courseLesson = getCourseLesson(lessonNumber, trackId);
  const track = getCourseTrack(trackId);
  const lessonGuide = getRealLifeLessonGuide(trackId);
  const lessonMaterials = getRealLifeMaterialsForLesson(lessonNumber, trackId);
  const [materialIndex, setMaterialIndex] = useState(0);
  const [mode, setMode] = useState<RealLifePracticeMode>("structure");
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [scaffoldLevel, setScaffoldLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [attemptedMaterials, setAttemptedMaterials] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  const material = lessonMaterials[materialIndex] ?? lessonMaterials[0];
  const task = buildRealLifeTask(material, mode, trackId);
  const selectedMode = realLifePracticeModes.find((item) => item.id === mode) ?? realLifePracticeModes[0];

  async function ensureSession() {
    if (sessionId) return sessionId;
    const result = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity: "authentic" })
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error ?? "세션을 시작할 수 없습니다.");
    setSessionId(body.id);
    setDemo(Boolean(body.demo));
    return body.id as string;
  }

  async function submit() {
    if (!draft.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      const id = await ensureSession();
      const studentMessage = [
        `[수업안] ${track.optionLabel} · ${track.title}`,
        `[수업 차시] ${lessonNumber}차시 · ${courseLesson.title}`,
        `[핵심 질문] ${courseLesson.keyQuestion}`,
        `[자료 유형] ${material.label}`,
        `[자료 제목] ${material.title}`,
        `[자료 본문]\n${material.content}`,
        `[현재 과제] ${task}`,
        `[학생 답]\n${draft}`
      ].join("\n\n");
      const result = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          activity: "authentic",
          message: studentMessage,
          scaffoldLevel,
          attemptCount,
          history: history.slice(-6)
        })
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "응답을 불러오지 못했습니다.");
      const next = body as AgentResponse & { demo?: boolean };
      setResponse(next);
      setDemo((current) => current || Boolean(next.demo));
      setScaffoldLevel(next.scaffoldLevel);
      setAttemptCount((count) => count + 1);
      setAttemptedMaterials((current) => new Set(current).add(material.id));
      setHistory((items) => [
        ...items,
        { role: "student", content: draft },
        { role: "assistant", content: `${next.studentMessage} ${next.question}` }
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPending(false);
    }
  }

  function changeMaterial(index: number) {
    setMaterialIndex(index);
    setMode("structure");
    setDraft("");
    setResponse(null);
    setSessionId(null);
    setHistory([]);
    setScaffoldLevel(0);
    setAttemptCount(0);
    setError("");
  }

  function changeMode(nextMode: RealLifePracticeMode) {
    setMode(nextMode);
    setDraft("");
    setResponse(null);
    setAttemptCount(0);
    setScaffoldLevel(0);
    setError("");
  }

  return (
    <div className="authentic-shell">
      <aside className="material-sidebar" aria-label={`${lessonNumber}차시 3장 실생활 자료`}>
        <div className="sidebar-heading">
          <span>Chapter 03 · {lessonNumber}차시</span>
          <strong>{courseLesson.title}</strong>
        </div>
        {lessonMaterials.map((item, index) => (
          <button
            aria-current={material.id === item.id ? "step" : undefined}
            className={material.id === item.id ? "material-button active" : "material-button"}
            key={item.id}
            onClick={() => changeMaterial(index)}
            type="button"
          >
            <span>{String(item.order).padStart(2, "0")}</span>
            <span>{item.label}</span>
            {attemptedMaterials.has(item.id) && <i aria-label="연습함">✓</i>}
          </button>
        ))}
      </aside>

      <section className="material-workspace" aria-labelledby="material-title">
        <header className="material-header">
          <div>
            <span className="eyebrow">{lessonNumber}차시 · {material.label} 탐구</span>
            <h1 id="material-title">{material.title}</h1>
            <p>{material.situation}</p>
          </div>
          {demo && <span className="demo-badge">개발용 데모</span>}
        </header>

        <section className="lesson-question-card compact" aria-label={`${lessonNumber}차시 핵심 질문`}>
          <span>핵심 질문</span>
          <strong>{courseLesson.keyQuestion}</strong>
        </section>

        <article className={`real-material-card material-${material.id}`}>
          <div className="material-meta">
            <span>{material.label}</span>
            <small>{material.sourceNote}</small>
          </div>
          <p>{material.content}</p>
        </article>

        <section className="analysis-guide" aria-labelledby="analysis-guide-title">
          <div>
            <span id="analysis-guide-title">1~4차시 종합 돋보기</span>
            <h2>배운 개념을 모두 활용해 살펴보세요</h2>
          </div>
          <div className="concept-tags" aria-label="활용 개념">
            {lessonGuide.focusConcepts.map((concept) => <span key={concept}>{concept}</span>)}
          </div>
          <ol className="concept-review-list">
            {lessonGuide.reviewPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ol>
          <ol className="analysis-question-list">
            {lessonGuide.analysisPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ol>
        </section>

        <section className="real-life-practice" aria-labelledby="practice-heading">
          <span id="practice-heading">나의 분석과 연습</span>
          <div className="practice-mode-switcher" role="group" aria-label="연습 방식">
            {realLifePracticeModes.map((item) => (
              <button
                aria-pressed={mode === item.id}
                className={mode === item.id ? "practice-mode active" : "practice-mode"}
                key={item.id}
                onClick={() => changeMode(item.id)}
                type="button"
              >
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>

          <div className="real-life-task">
            <span>{selectedMode.label} 과제</span>
            <p>{task}</p>
          </div>

          <label className="draft-label" htmlFor="real-life-draft">내 생각과 고쳐 쓴 문장</label>
          <textarea
            id="real-life-draft"
            maxLength={2500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="자료에서 찾은 근거와 내 판단을 먼저 적어 보세요. 고쳐 쓰기에서는 바꾼 이유도 함께 설명해 보세요."
            value={draft}
          />
          <div className="editor-footer">
            <span>{draft.length.toLocaleString()} / 2,500자</span>
            <button className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
              {pending ? "생각을 살펴보는 중…" : "질문과 힌트 받기"}
            </button>
          </div>

          {error && <div className="error-panel" role="alert">{error}</div>}
          {response && (
            <article className="coach-card" aria-live="polite">
              <div className="coach-label"><span>AI 학습 도우미</span><small>{scaffoldLabel(response.scaffoldLevel)}</small></div>
              <p>{response.studentMessage}</p>
              <div className="coach-question">
                <span>다음 생각</span>
                <strong>{response.question}</strong>
              </div>
              {response.focusConcepts.length > 0 && (
                <div className="concept-tags" aria-label="AI가 살펴본 개념">
                  {response.focusConcepts.map((concept) => <span key={concept}>{concept}</span>)}
                </div>
              )}
            </article>
          )}
        </section>
      </section>

      <aside className="transfer-panel" aria-label="3장 학습 진행">
        <span className="panel-kicker">{lessonNumber}차시 전이 학습</span>
        <h2>배운 개념을<br />실제 글로 옮겨요</h2>
        <dl>
          <div><dt>살펴본 자료</dt><dd>{attemptedMaterials.size}/{lessonMaterials.length}</dd></div>
          <div><dt>현재 도움</dt><dd>{scaffoldLevel + 1}/5</dd></div>
          <div><dt>현재 단계</dt><dd>{selectedMode.label}</dd></div>
        </dl>
        <div className="transfer-sequence">
          {realLifePracticeModes.map((item, index) => (
            <div className={mode === item.id ? "active" : ""} key={item.id}>
              <span>{index + 1}</span>
              <p><strong>{item.label}</strong><small>{item.description}</small></p>
            </div>
          ))}
        </div>
        <p className="privacy-reminder">실제 사람의 이름, 계정, 연락처는 입력하지 마세요. 화면의 자료는 모두 수업용으로 새로 만든 예시입니다.</p>
      </aside>
    </div>
  );
}
