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
  const [studentObservation, setStudentObservation] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");
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

  async function submit() {
    if (!draft.trim() || pending) return;
    const submittedDraft = draft.trim();
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
          ? `[큰 질문] ${material.analysisPrompts[0]}`
          : `[현재 과제] ${task}`,
        isLiterature
          ? `[학생이 고른 근거 부분]\n${selectedSentence.replace(/\s*\n\s*/g, " ")}`
          : null,
        isLiterature
          ? `[문학 탐구 순서] 큰 질문을 읽고 작품에서 근거 부분을 고른 뒤 그 자리에서 자기 답을 작성함`
          : null,
        isLiterature
          ? `[튜터 응답 원칙] 학생이 고른 근거 부분과 답을 구체적으로 반영해 한 가지 근거만 다시 묻고, 완성 분석이나 정답은 먼저 제시하지 말 것`
          : null,
        `[학생 답]\n${submittedDraft}`
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
      if (isLiterature && !studentObservation) setStudentObservation(submittedDraft);
      setAttemptedMaterials((current) => new Set(current).add(material.id));
      setHistory((items) => [
        ...items,
        { role: "student", content: submittedDraft },
        { role: "assistant", content: `${next.studentMessage} ${next.question}` }
      ]);
      if (isLiterature) setDraft("");
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
    setStudentObservation("");
    setSelectedSentence("");
    setError("");
  }

  function chooseLiteratureSentence(sentence: string) {
    if (!isLiterature || studentObservation || pending) return;
    setSelectedSentence(sentence);
    setDraft("");
    requestAnimationFrame(() => {
      draftRef.current?.focus();
    });
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
                <span>먼저 생각할 큰 질문</span>
                <strong id="literature-big-question-title">{material.analysisPrompts[0]}</strong>
                <small>답의 근거가 되는 작품 부분을 누르면, 그 자리에서 답을 쓸 수 있어요.</small>
              </section>
              <p className="sentence-pick-guide">작품을 충분히 읽고 근거가 되는 부분을 누르세요. 시에서는 하나의 문장으로 읽히는 행 묶음을 선택할 수 있어요.</p>
              <div className="literature-sentence-list" aria-label="클릭해서 분석할 문장 고르기">
                {material.selectableSentences.map((sentence, index) => {
                  const isSelected = selectedSentence === sentence;
                  return (
                    <div className={isSelected ? "literature-sentence-wrap selected" : "literature-sentence-wrap"} key={`${material.id}-${index}`}>
                      <button
                        aria-pressed={isSelected}
                        className={isSelected ? "literature-sentence selected" : "literature-sentence"}
                        disabled={(Boolean(studentObservation) && !isSelected) || pending}
                        onClick={() => chooseLiteratureSentence(sentence)}
                        type="button"
                      >
                        <span>{sentence}</span>
                        {isSelected && <small>근거로 선택한 부분</small>}
                      </button>
                      {isSelected && (
                        <section className="inline-literature-answer" aria-label="선택한 부분에 답 쓰기">
                          {studentObservation && (
                            <article className="student-observation-card">
                              <span>이 부분을 근거로 쓴 내 답</span>
                              <p>{studentObservation}</p>
                            </article>
                          )}
                          {response && (
                            <article className="coach-card literature-coach" aria-live="polite">
                              <div className="coach-label"><span>AI 학습 도우미</span><small>{scaffoldLabel(response.scaffoldLevel)}</small></div>
                              <p>{response.studentMessage}</p>
                              <div className="coach-question">
                                <span>선택한 부분에서 이어진 질문</span>
                                <strong>{response.question}</strong>
                              </div>
                            </article>
                          )}
                          <label className="draft-label" htmlFor="literature-inline-draft">
                            {studentObservation ? "AI의 다음 질문에 대한 내 설명" : "선택한 부분을 근거로 한 내 답"}
                          </label>
                          <textarea
                            id="literature-inline-draft"
                            maxLength={2500}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder={studentObservation
                              ? "AI가 물은 한 가지에 대해 작품의 표현을 근거로 설명해 보세요."
                              : "큰 질문에 대한 내 생각을 쓰세요. 주어·서술어 관계나 절의 경계를 근거로 들면 좋아요."}
                            ref={draftRef}
                            value={draft}
                          />
                          <div className="editor-footer">
                            <span>{draft.length.toLocaleString()} / 2,500자</span>
                            <button className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
                              {pending ? "생각을 살펴보는 중…" : studentObservation ? "내 설명 보내기" : "이 부분을 근거로 답 보내기"}
                            </button>
                          </div>
                          {error && <div className="error-panel" role="alert">{error}</div>}
                        </section>
                      )}
                    </div>
                  );
                })}
              </div>
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
          <div><dt>현재 단계</dt><dd>{isLiterature ? studentObservation ? "후속 탐구" : selectedSentence ? "답 작성" : "근거 선택" : selectedMode.label}</dd></div>
        </dl>
        <div className="transfer-sequence">
          {isLiterature
            ? [
                ["큰 질문", "작품을 읽기 전에 탐구할 질문 하나를 확인해요."],
                ["근거 선택·답", "작품에서 근거 부분을 누르고 바로 아래에 답을 써요."],
                ["후속 탐구", "AI가 선택한 부분과 내 답을 바탕으로 한 가지를 물어요."]
              ].map(([label, description], index) => (
                <div className={index === (studentObservation ? 2 : selectedSentence ? 1 : 0) ? "active" : ""} key={label}>
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
