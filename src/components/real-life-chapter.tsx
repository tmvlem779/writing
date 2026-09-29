"use client";

import { useRef, useState } from "react";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getCourseLesson, getCourseTrack, type CourseLessonNumber, type CourseTrackId } from "@/lib/curriculum/five-lesson-course";
import {
  buildRealLifeTask,
  getRealLifeMaterialGroup,
  getRealLifeLessonGuide,
  getRealLifeMaterialsForLesson,
  realLifePracticeModes,
  type RealLifeMaterialGroup,
  type RealLifePracticeMode
} from "@/lib/curriculum/real-life-materials";

type Message = { role: "student" | "assistant"; content: string };

type RealLifeChapterProps = {
  lessonNumber: CourseLessonNumber;
  trackId: CourseTrackId;
  showOverview?: boolean;
  materialGroup?: RealLifeMaterialGroup;
};

export function RealLifeChapter({ lessonNumber, trackId, showOverview = true, materialGroup = "all" }: RealLifeChapterProps) {
  const courseLesson = getCourseLesson(lessonNumber, trackId);
  const track = getCourseTrack(trackId);
  const lessonGuide = getRealLifeLessonGuide(trackId);
  const lessonMaterials = getRealLifeMaterialsForLesson(lessonNumber, trackId, materialGroup);
  const [materialIndex, setMaterialIndex] = useState(0);
  const [mode, setMode] = useState<RealLifePracticeMode>("structure");
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [scaffoldLevel, setScaffoldLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [selectedSentences, setSelectedSentences] = useState<string[]>([]);
  const [literatureSelectionSubmitted, setLiteratureSelectionSubmitted] = useState(false);
  const [attemptedMaterials, setAttemptedMaterials] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const material = lessonMaterials[materialIndex] ?? lessonMaterials[0];
  const isLiterature = getRealLifeMaterialGroup(material) === "literature";
  const task = buildRealLifeTask(material, mode);
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

  async function sendTurn(submittedDraft: string, selectionTurn = false) {
    const normalizedDraft = submittedDraft.trim();
    if (pending || (!selectionTurn && !normalizedDraft)) return;
    if (selectionTurn && (!isLiterature || literatureSelectionSubmitted || selectedSentences.length === 0)) return;
    setPending(true);
    setError("");
    try {
      const id = await ensureSession();
      const studentMessage = [
        `[수업안] ${track.optionLabel} · ${track.title}`,
        `[수업 차시] ${lessonNumber}차시 · ${courseLesson.title}`,
        `[핵심 질문] ${courseLesson.keyQuestion}`,
        `[자료 유형] ${isLiterature ? `문학 작품 · ${material.genre}` : material.label}`,
        `[자료 제목] ${material.title}`,
        `[자료 본문]\n${material.content}`,
        isLiterature
          ? `[첫 과제] 작품에서 겹문장을 찾아 모두 고르시오.`
          : `[현재 과제] ${task}`,
        isLiterature
          ? `[학생이 겹문장으로 고른 문장들]\n${selectedSentences.map((sentence, index) => `${index + 1}. ${sentence.replace(/\s*\n\s*/g, " ")}`).join("\n")}`
          : null,
        isLiterature
          ? `[문학 탐구 단계] ${selectionTurn ? "학생이 겹문장 후보를 모두 골라 처음 제출함" : "학생이 선택한 문장들을 바탕으로 받은 질문에 답함"}`
          : null,
        isLiterature
          ? `[튜터 응답 원칙] 고른 문장들을 구체적으로 반영해 한 번에 질문 하나만 제시할 것. 빠뜨리거나 과잉 선택한 문장이 있어도 정답 목록을 먼저 공개하지 말고 주어·서술어 관계나 절 경계를 확인하게 할 것`
          : null,
        `[학생 답]\n${selectionTurn ? "문장 다중 선택을 제출함" : normalizedDraft}`
      ].filter(Boolean).join("\n\n");
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
      if (selectionTurn) setLiteratureSelectionSubmitted(true);
      setAttemptedMaterials((current) => new Set(current).add(material.id));
      setHistory((items) => [
        ...items,
        {
          role: "student",
          content: selectionTurn
            ? `겹문장 후보 ${selectedSentences.length}개 선택: ${selectedSentences.join(" / ")}`
            : normalizedDraft
        },
        { role: "assistant", content: `${next.studentMessage} ${next.question}` }
      ]);
      if (isLiterature) {
        setDraft("");
        requestAnimationFrame(() => draftRef.current?.focus());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPending(false);
    }
  }

  async function submit() {
    await sendTurn(draft);
  }

  async function submitLiteratureSelection() {
    await sendTurn("문장 다중 선택", true);
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
    setSelectedSentences([]);
    setLiteratureSelectionSubmitted(false);
    setError("");
  }

  function chooseLiteratureSentence(sentence: string) {
    if (!isLiterature || literatureSelectionSubmitted || pending) return;
    setSelectedSentences((current) => current.includes(sentence)
      ? current.filter((item) => item !== sentence)
      : [...current, sentence]);
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
      <aside className="material-sidebar" aria-label={materialGroup === "literature" ? "문학 작품 목록" : `${lessonNumber}차시 실생활 자료`}>
        <div className="sidebar-heading">
          <span>{materialGroup === "literature" ? "시·소설 질문·근거 탐구" : `Chapter 03 · ${lessonNumber}차시`}</span>
          <strong>{materialGroup === "literature" ? "답의 근거를 직접 찾아요" : courseLesson.title}</strong>
        </div>
        {lessonMaterials.map((item, index) => (
          <button
            aria-current={material.id === item.id ? "step" : undefined}
            className={material.id === item.id ? "material-button active" : "material-button"}
            key={item.id}
            onClick={() => changeMaterial(index)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>{item.genre ? `${item.genre} · ${item.author}` : item.label}</span>
            {attemptedMaterials.has(item.id) && <i aria-label="연습함">✓</i>}
          </button>
        ))}
      </aside>

      <section className="material-workspace" aria-labelledby="material-title">
        <header className="material-header">
          <div>
            <span className="eyebrow">{isLiterature ? `${material.genre} · 질문·근거 탐구` : `${lessonNumber}차시 · ${material.label} 탐구`}</span>
            <h1 id="material-title">{material.title}</h1>
            <p>{material.situation}</p>
          </div>
          {demo && <span className="demo-badge">개발용 데모</span>}
        </header>

        {!isLiterature && (
          <section className="lesson-question-card compact" aria-label={`${lessonNumber}차시 핵심 질문`}>
            <span>핵심 질문</span>
            <strong>{courseLesson.keyQuestion}</strong>
          </section>
        )}

        <article className={`real-material-card material-${material.id} ${isLiterature ? `material-literature literature-${material.genre === "시" ? "poem" : "prose"}` : ""}`}>
          <div className="material-meta">
            <span>{isLiterature ? `${material.genre} · ${material.author}` : material.label}</span>
            <small>{material.sourceNote}</small>
          </div>
          {isLiterature && material.selectableSentences ? (
            <>
              <section className="literature-big-question" aria-labelledby="literature-big-question-title">
                <span>첫 번째 과제</span>
                <strong id="literature-big-question-title">작품에서 겹문장을 찾아 모두 고르시오.</strong>
                <small>겹문장이라고 판단한 문장은 여러 개 선택할 수 있어요. 선택을 마친 뒤 한 번에 제출하세요.</small>
              </section>
              <p className="sentence-pick-guide">문장을 누르면 선택되고, 다시 누르면 선택이 해제됩니다. 시에서는 하나의 문장으로 읽히는 행 묶음을 선택하세요.</p>
              <div className="literature-sentence-list" aria-label="겹문장이라고 판단한 문장 모두 고르기">
                {material.selectableSentences.map((sentence, index) => {
                  const isSelected = selectedSentences.includes(sentence);
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={isSelected ? "literature-sentence selected" : "literature-sentence"}
                      disabled={literatureSelectionSubmitted || pending}
                      key={`${material.id}-${index}`}
                      onClick={() => chooseLiteratureSentence(sentence)}
                      type="button"
                    >
                      <span>{sentence}</span>
                      {isSelected && <small>겹문장으로 선택</small>}
                    </button>
                  );
                })}
              </div>
              {!literatureSelectionSubmitted ? (
                <div className="literature-selection-actions">
                  <span><strong>{selectedSentences.length}개</strong> 문장을 선택했어요.</span>
                  <button
                    className="primary-button"
                    disabled={pending || selectedSentences.length === 0}
                    onClick={submitLiteratureSelection}
                    type="button"
                  >
                    {pending ? "선택을 살펴보는 중…" : "선택 완료하고 질문 받기"}
                  </button>
                </div>
              ) : (
                <section className="literature-followup-panel" aria-label="선택한 문장 기반 질문">
                  <div className="selected-sentence-summary">
                    <span>내가 고른 겹문장 후보 · {selectedSentences.length}개</span>
                    <ol>{selectedSentences.map((sentence) => <li key={sentence}>{sentence.replace(/\s*\n\s*/g, " ")}</li>)}</ol>
                  </div>
                  {response && (
                    <article className="coach-card literature-coach" aria-live="polite">
                      <div className="coach-label"><span>AI 학습 도우미</span><small>{response.safety.blocked ? "안전 안내" : scaffoldLabel(response.scaffoldLevel)}</small></div>
                      <p>{response.studentMessage}</p>
                      <div className="coach-question">
                        <span>{response.safety.blocked ? "안전한 학습을 위한 안내" : "고른 문장들을 바탕으로 한 질문"}</span>
                        <strong>{response.question}</strong>
                      </div>
                    </article>
                  )}
                  <label className="draft-label" htmlFor="literature-followup-draft">질문에 대한 내 답</label>
                  <textarea
                    id="literature-followup-draft"
                    maxLength={2500}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="선택한 문장의 주어·서술어 관계나 절의 경계를 근거로 답해 보세요."
                    ref={draftRef}
                    value={draft}
                  />
                  <div className="editor-footer">
                    <span>{draft.length.toLocaleString()} / 2,500자</span>
                    <button className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
                      {pending ? "답을 살펴보는 중…" : "답 보내고 다음 질문 받기"}
                    </button>
                  </div>
                </section>
              )}
              {error && <div className="error-panel" role="alert">{error}</div>}
            </>
          ) : (
            <p>{material.content}</p>
          )}
        </article>

        {showOverview && (
          <section className="analysis-guide" aria-labelledby="analysis-guide-title">
            <div>
              <span id="analysis-guide-title">1~{lessonNumber - 1}차시 종합 돋보기</span>
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
        )}

        {!isLiterature && (
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
              ref={draftRef}
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
        )}
      </section>

      <aside className="transfer-panel" aria-label={isLiterature ? "문학 근거 탐구 진행" : "3장 학습 진행"}>
        <span className="panel-kicker">{isLiterature ? "큰 질문에서 근거로" : `${lessonNumber}차시 전이 학습`}</span>
        <h2>{isLiterature ? <>작품에서<br />답의 근거를 찾아요</> : <>배운 개념을<br />실제 글로 옮겨요</>}</h2>
        <dl>
          <div><dt>살펴본 자료</dt><dd>{attemptedMaterials.size}/{lessonMaterials.length}</dd></div>
          <div><dt>현재 도움</dt><dd>{scaffoldLevel + 1}/5</dd></div>
          <div><dt>현재 단계</dt><dd>{isLiterature ? literatureSelectionSubmitted ? "질문 이어가기" : selectedSentences.length > 0 ? "선택 확인" : "겹문장 찾기" : selectedMode.label}</dd></div>
        </dl>
        <div className="transfer-sequence">
          {isLiterature
            ? [
                ["겹문장 찾기", "작품에서 겹문장이라고 판단한 문장을 모두 골라요."],
                ["선택 제출", "고른 문장을 한 번에 제출하고 판단을 점검해요."],
                ["질문 이어가기", "AI가 선택한 문장들을 바탕으로 질문을 하나씩 이어 가요."]
              ].map(([label, description], index) => (
                <div className={index === (literatureSelectionSubmitted ? 2 : selectedSentences.length > 0 ? 1 : 0) ? "active" : ""} key={label}>
                  <span>{index + 1}</span>
                  <p><strong>{label}</strong><small>{description}</small></p>
                </div>
              ))
            : realLifePracticeModes.map((item, index) => (
                <div className={mode === item.id ? "active" : ""} key={item.id}>
                  <span>{index + 1}</span>
                  <p><strong>{item.label}</strong><small>{item.description}</small></p>
                </div>
              ))}
        </div>
        <p className="privacy-reminder">실제 사람의 이름, 계정, 연락처는 입력하지 마세요. 문학 작품 외의 화면 자료는 모두 수업용으로 새로 만든 예시입니다.</p>
      </aside>
    </div>
  );
}
