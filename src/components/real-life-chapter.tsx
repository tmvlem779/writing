"use client";

import { useRef, useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
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

type NovelSentenceWork = {
  markedTokenIndexes: number[];
  relation: string;
  questionReady: boolean;
  answerSubmitted: boolean;
  draft: string;
  response: AgentResponse | null;
};

const novelStructureOptions = ["한 가지 내용", "둘 이상의 내용", "잘 모르겠어요"] as const;

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
  const [novelSentenceIndex, setNovelSentenceIndex] = useState(0);
  const [completedNovelSentenceIndexes, setCompletedNovelSentenceIndexes] = useState<number[]>([]);
  const [novelSentenceWork, setNovelSentenceWork] = useState<Record<number, NovelSentenceWork>>({});
  const [markedNovelTokenIndexes, setMarkedNovelTokenIndexes] = useState<number[]>([]);
  const [novelRelation, setNovelRelation] = useState("");
  const [novelAnswerSubmitted, setNovelAnswerSubmitted] = useState(false);
  const [literatureSelectionSubmitted, setLiteratureSelectionSubmitted] = useState(false);
  const [attemptedMaterials, setAttemptedMaterials] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const material = lessonMaterials[materialIndex] ?? lessonMaterials[0];
  const isLiterature = getRealLifeMaterialGroup(material) === "literature";
  const isPoem = isLiterature && material.genre === "시";
  const literatureTaskTitle = isPoem
    ? "시에서 표현 효과를 만드는 문법 요소가 드러난 구절을 고르시오."
    : "작품의 모든 문장을 차례로 살펴보고, 문장 구조의 단서에 밑줄을 그으시오.";
  const literatureSelectionLabel = isPoem ? "문법 요소 탐구 구절" : "문장";
  const activeNovelSentence = !isPoem ? material.selectableSentences?.[novelSentenceIndex] : undefined;
  const selectedNovelTokens = activeNovelSentence?.split(/\s+/) ?? [];
  const novelGuideQuestion = novelRelation === "한 가지 내용"
    ? "밑줄 친 말이 나타내는 중심 행동이나 상태는 무엇인가요? 짧게 써 보세요."
    : novelRelation === "둘 이상의 내용"
      ? "밑줄 친 말의 앞과 뒤에서는 각각 어떤 일이 일어나나요? 짧게 써 보세요."
      : "밑줄 친 말 주변에서 일어나는 일을 하나만 찾아 짧게 써 보세요.";
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
    if (selectionTurn && (
      !isLiterature
      || literatureSelectionSubmitted
      || selectedSentences.length === 0
    )) return;
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
        isPoem ? `[이 작품에서 살필 문법 요소] ${material.focusConcepts.join(", ")}` : null,
        isLiterature
          ? `[첫 과제] ${literatureTaskTitle}`
          : `[현재 과제] ${task}`,
        isLiterature
          ? `[학생이 살펴보는 ${literatureSelectionLabel}]\n${(isPoem ? selectedSentences : activeNovelSentence ? [activeNovelSentence] : []).map((sentence, index) => `${index + 1}. ${sentence.replace(/\s*\n\s*/g, " ")}`).join("\n")}`
          : null,
        isLiterature && !isPoem
          ? `[학생이 문장 안에서 밑줄 친 연결 표현] ${markedNovelTokenIndexes.map((index) => selectedNovelTokens[index]).filter(Boolean).join(" · ")}`
          : null,
        isLiterature && !isPoem
          ? `[학생이 고른 문장 구조] ${novelRelation}`
          : null,
        isLiterature && !isPoem
          ? `[학생이 받은 질문] ${novelGuideQuestion}`
          : null,
        isLiterature
          ? `[문학 탐구 단계] ${isPoem && selectionTurn ? `학생이 ${literatureSelectionLabel}을 골라 처음 제출함` : isPoem ? "학생이 선택한 부분을 바탕으로 받은 질문에 답함" : `전체 ${material.selectableSentences?.length ?? 0}문장 중 ${novelSentenceIndex + 1}번째 문장에 직접 표시하고 질문에 답함`}`
          : null,
        isLiterature
          ? isPoem
            ? `[튜터 응답 원칙] 고른 구절을 구체적으로 반영해 한 번에 질문 하나만 제시할 것. 문법 요소의 형태를 먼저 찾게 하고, 그 요소가 화자의 태도·시간·정서·호흡에 만드는 효과로 질문을 넓힐 것. 완성 분석은 먼저 제시하지 말 것`
            : `[튜터 응답 원칙] 학생이 문장 안에 직접 밑줄 친 표현, 고른 구조, 짧은 답을 반영해 한두 문장으로 확인해 줄 것. 정답이나 완성 분석을 먼저 제시하지 말고, 다음 문장에서도 같은 방법으로 시도하도록 격려하는 짧은 질문으로 마칠 것`
          : null,
        `[학생 답]\n${selectionTurn ? `${literatureSelectionLabel} 선택을 제출함` : normalizedDraft}`
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
            ? isPoem
              ? `${literatureSelectionLabel} ${selectedSentences.length}개 선택: ${selectedSentences.join(" / ")}`
              : `${literatureSelectionLabel}: ${activeNovelSentence} / 밑줄: ${markedNovelTokenIndexes.map((index) => selectedNovelTokens[index]).filter(Boolean).join(" · ")} / 구조: ${novelRelation}`
            : normalizedDraft
        },
        { role: "assistant", content: `${next.studentMessage} ${next.question}` }
      ]);
      if (isLiterature) {
        if (!isPoem && !selectionTurn) {
          setNovelAnswerSubmitted(true);
          setCompletedNovelSentenceIndexes((current) => current.includes(novelSentenceIndex)
            ? current
            : [...current, novelSentenceIndex]);
          setNovelSentenceWork((current) => ({
            ...current,
            [novelSentenceIndex]: {
              markedTokenIndexes: markedNovelTokenIndexes,
              relation: novelRelation,
              questionReady: true,
              answerSubmitted: true,
              draft: "",
              response: next
            }
          }));
        }
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
    setNovelSentenceIndex(0);
    setCompletedNovelSentenceIndexes([]);
    setNovelSentenceWork({});
    setMarkedNovelTokenIndexes([]);
    setNovelRelation("");
    setNovelAnswerSubmitted(false);
    setLiteratureSelectionSubmitted(false);
    setError("");
  }

  function chooseLiteratureSentence(sentence: string) {
    if (!isPoem || literatureSelectionSubmitted || pending) return;
    setSelectedSentences((current) => current.includes(sentence)
      ? current.filter((item) => item !== sentence)
      : [...current, sentence]);
  }

  function toggleNovelToken(index: number) {
    if (isPoem || literatureSelectionSubmitted || pending) return;
    setMarkedNovelTokenIndexes((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index]);
  }

  function prepareNovelQuestion() {
    if (isPoem || pending || markedNovelTokenIndexes.length === 0 || !novelRelation) return;
    setLiteratureSelectionSubmitted(true);
    setNovelAnswerSubmitted(false);
    setDraft("");
    setResponse(null);
    requestAnimationFrame(() => draftRef.current?.focus());
  }

  function selectNovelSentence(index: number) {
    if (isPoem || pending || index === novelSentenceIndex) return;
    setNovelSentenceWork((current) => ({
      ...current,
      [novelSentenceIndex]: {
        markedTokenIndexes: markedNovelTokenIndexes,
        relation: novelRelation,
        questionReady: literatureSelectionSubmitted,
        answerSubmitted: novelAnswerSubmitted,
        draft,
        response
      }
    }));
    const saved = novelSentenceWork[index];
    setNovelSentenceIndex(index);
    setMarkedNovelTokenIndexes(saved?.markedTokenIndexes ?? []);
    setNovelRelation(saved?.relation ?? "");
    setLiteratureSelectionSubmitted(saved?.questionReady ?? false);
    setNovelAnswerSubmitted(saved?.answerSubmitted ?? false);
    setDraft(saved?.draft ?? "");
    setResponse(saved?.response ?? null);
    setAttemptCount(0);
    setScaffoldLevel(saved?.response?.scaffoldLevel ?? 0);
    setHistory([]);
  }

  function advanceNovelSentence() {
    if (isPoem || !material.selectableSentences) return;
    if (novelSentenceIndex >= material.selectableSentences.length - 1) return;
    selectNovelSentence(novelSentenceIndex + 1);
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

      <section className="material-workspace" aria-busy={pending} aria-labelledby="material-title">
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
                <strong id="literature-big-question-title">{literatureTaskTitle}</strong>
                <small>{isPoem
                  ? "높임·시간·부정·종결·생략·반복 표현 등을 살펴보고, 표현 효과가 궁금한 구절을 하나 이상 고르세요."
                  : "첫 문장부터 마지막 문장까지 하나씩 표시하고, 짧은 질문에 답해 보세요."}</small>
              </section>
              {isPoem ? (
                <>
                  <p className="sentence-pick-guide">시를 전체 흐름으로 읽고, 문법 요소가 표현 효과를 만드는 구절을 누르세요. 다시 누르면 선택이 해제됩니다.</p>
                  <div className="literature-sentence-list" aria-label="문법 요소가 표현 효과를 만드는 구절 고르기">
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
                          {isSelected && <small>문법 요소 탐구 구절로 선택</small>}
                        </button>
                      );
                    })}
                  </div>
                  {!literatureSelectionSubmitted ? (
                    <div className="literature-selection-actions">
                      <span><strong>{selectedSentences.length}개</strong> 구절을 선택했어요.</span>
                      <button aria-busy={pending} className="primary-button" disabled={pending || selectedSentences.length === 0} onClick={submitLiteratureSelection} type="button">
                        {pending ? <MondeukLoading compact message="선택한 구절을 살펴보고 있어요." /> : "선택 완료하고 질문 받기"}
                      </button>
                    </div>
                  ) : (
                    <section className="literature-followup-panel" aria-label="선택한 구절 기반 질문">
                      <div className="selected-sentence-summary">
                        <span>내가 고른 {literatureSelectionLabel} · {selectedSentences.length}개</span>
                        <ol>{selectedSentences.map((sentence) => <li key={sentence}>{sentence.replace(/\s*\n\s*/g, " ")}</li>)}</ol>
                      </div>
                      {response && (
                        <article className="coach-card literature-coach" aria-live="polite">
                          <div className="coach-label"><span>AI 학습 도우미</span><small>{response.safety.blocked ? "안전 안내" : scaffoldLabel(response.scaffoldLevel)}</small></div>
                          <p>{response.studentMessage}</p>
                          <div className="coach-question">
                            <span>{response.safety.blocked ? "안전한 학습을 위한 안내" : "고른 구절을 바탕으로 한 질문"}</span>
                            <strong>{response.question}</strong>
                          </div>
                        </article>
                      )}
                      <label className="draft-label" htmlFor="literature-followup-draft">질문에 대한 내 답</label>
                      <textarea id="literature-followup-draft" maxLength={2500} onChange={(event) => setDraft(event.target.value)} placeholder="선택한 구절의 문법 형태와 그 표현 효과를 근거로 답해 보세요." ref={draftRef} value={draft} />
                      <div className="editor-footer">
                        <span>{draft.length.toLocaleString()} / 2,500자</span>
                        <button aria-busy={pending} className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
                          {pending ? <MondeukLoading compact /> : "답 보내고 다음 질문 받기"}
                        </button>
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <>
                  <p className="sentence-pick-guide">모든 문장은 처음부터 열려 있습니다. 원하는 문장을 눌러 자유롭게 표시하고 답해 보세요.</p>
                  <div className="novel-sentence-progress-list" aria-label="소설 전체 문장 활동 진행 현황">
                    {material.selectableSentences.map((sentence, index) => {
                      const isComplete = completedNovelSentenceIndexes.includes(index);
                      const isCurrent = novelSentenceIndex === index;
                      return (
                        <button
                          aria-current={isCurrent ? "step" : undefined}
                          className={isComplete ? "complete" : isCurrent ? "current" : "available"}
                          key={`${material.id}-${index}`}
                          onClick={() => selectNovelSentence(index)}
                          type="button"
                        >
                          <span>{index + 1}</span>
                          <p>{sentence}</p>
                          <small>{isComplete ? "답변 완료 ✓" : isCurrent ? "현재 활동" : "열어 보기"}</small>
                        </button>
                      );
                    })}
                  </div>
                  {!literatureSelectionSubmitted ? (
                    <>
                      <section className="novel-marking-panel" aria-labelledby="novel-marking-title">
                        <div>
                          <span>문장 {novelSentenceIndex + 1}/{material.selectableSentences.length} · 직접 표시하기</span>
                          <strong id="novel-marking-title">문장 구조를 판단하는 데 도움이 되는 말에 밑줄을 그으세요.</strong>
                          <small>행동이나 상태를 나타내는 말, 또는 내용을 이어 주는 말을 눌러 보세요.</small>
                        </div>
                        <p className="novel-token-line" aria-label={`${novelSentenceIndex + 1}번째 문장에 밑줄 긋기`}>
                          {selectedNovelTokens.map((token, index) => {
                            const isMarked = markedNovelTokenIndexes.includes(index);
                            return (
                              <button aria-pressed={isMarked} className={isMarked ? "novel-token marked" : "novel-token"} key={`${token}-${index}`} onClick={() => toggleNovelToken(index)} type="button">
                                {token}
                              </button>
                            );
                          })}
                        </p>
                        <fieldset className="novel-relation-picker">
                          <legend>이 문장은 몇 가지 내용을 담고 있나요?</legend>
                          <div>
                            {novelStructureOptions.map((option) => (
                              <button aria-pressed={novelRelation === option} className={novelRelation === option ? "active" : ""} key={option} onClick={() => setNovelRelation(option)} type="button">
                                {option}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      </section>
                      <div className="literature-selection-actions">
                        <span>{markedNovelTokenIndexes.length === 0
                          ? "문장 안에서 구조의 단서를 눌러 보세요."
                          : !novelRelation
                            ? "이 문장이 담은 내용의 수를 골라 보세요."
                            : "밑줄 표시와 구조 선택을 마쳤어요."}</span>
                        <button className="primary-button" disabled={pending || markedNovelTokenIndexes.length === 0 || !novelRelation} onClick={prepareNovelQuestion} type="button">
                          표시 완료하고 질문 보기
                        </button>
                      </div>
                    </>
                  ) : (
                    <section className="literature-followup-panel" aria-label={`${novelSentenceIndex + 1}번째 문장 질문과 답변`}>
                      <div className="selected-sentence-summary">
                        <span>문장 {novelSentenceIndex + 1}/{material.selectableSentences.length} · 내가 표시한 문장</span>
                        <ol><li>{selectedNovelTokens.map((token, index) => (
                          <span className={markedNovelTokenIndexes.includes(index) ? "summary-marked-token" : undefined} key={`${token}-${index}`}>
                            {token}{index < selectedNovelTokens.length - 1 ? " " : ""}
                          </span>
                        ))}</li></ol>
                      </div>
                      {!response && (
                        <article className="coach-card literature-coach">
                          <div className="coach-label"><span>문장 표시를 바탕으로 한 질문</span><small>짧게 답해요</small></div>
                          <p>밑줄 친 부분과 ‘{novelRelation}’ 선택을 바탕으로 생각해 보세요.</p>
                          <div className="coach-question"><span>한 문장 질문</span><strong>{novelGuideQuestion}</strong></div>
                        </article>
                      )}
                      {response && (
                        <article className="coach-card literature-coach" aria-live="polite">
                          <div className="coach-label"><span>AI 학습 도우미</span><small>{response.safety.blocked ? "안전 안내" : scaffoldLabel(response.scaffoldLevel)}</small></div>
                          <p>{response.studentMessage}</p>
                          <div className="coach-question"><span>{response.safety.blocked ? "안전한 학습을 위한 안내" : "이 문장 확인"}</span><strong>{response.question}</strong></div>
                        </article>
                      )}
                      {!novelAnswerSubmitted ? (
                        <>
                          <label className="draft-label" htmlFor="literature-followup-draft">질문에 대한 내 답</label>
                          <textarea id="literature-followup-draft" maxLength={600} onChange={(event) => setDraft(event.target.value)} placeholder="한두 문장으로 짧게 답해 보세요." ref={draftRef} value={draft} />
                          <div className="editor-footer">
                            <span>{draft.length.toLocaleString()} / 600자</span>
                            <button aria-busy={pending} className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
                              {pending ? <MondeukLoading compact /> : "답 보내고 이 문장 완료"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="novel-sentence-complete-actions">
                          <span><strong>{completedNovelSentenceIndexes.length}/{material.selectableSentences.length}</strong> 문장을 완료했어요.</span>
                          {novelSentenceIndex < material.selectableSentences.length - 1
                            ? <button className="primary-button" onClick={advanceNovelSentence} type="button">다음 문장으로</button>
                            : <strong>모든 문장 활동을 마쳤어요!</strong>}
                        </div>
                      )}
                    </section>
                  )}
                </>
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
              <button aria-busy={pending} className="primary-button" disabled={pending || !draft.trim()} onClick={submit} type="button">
                {pending ? <MondeukLoading compact /> : "질문과 힌트 받기"}
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
          <div><dt>현재 단계</dt><dd>{isLiterature
            ? isPoem
              ? literatureSelectionSubmitted ? "질문 이어가기" : selectedSentences.length > 0 ? "선택 확인" : "문법 요소 찾기"
              : novelAnswerSubmitted ? "문장 완료" : literatureSelectionSubmitted ? "질문에 답하기" : `문장 ${novelSentenceIndex + 1} 표시`
            : selectedMode.label}</dd></div>
          {!isPoem && isLiterature && <div><dt>문장 진행</dt><dd>{completedNovelSentenceIndexes.length}/{material.selectableSentences?.length ?? 0}</dd></div>}
        </dl>
        <div className="transfer-sequence">
          {isLiterature
            ? (isPoem ? [
                ["문법 요소 찾기", "시에서 표현 효과를 만드는 문법 요소가 드러난 구절을 골라요."],
                ["선택 제출", "고른 구절을 한 번에 제출하고 문법 형태를 살펴봐요."],
                ["질문 이어가기", "AI가 선택한 구절을 바탕으로 형태와 표현 효과를 하나씩 물어요."]
              ] : [
                ["문장에 표시하기", "현재 문장의 구조 단서에 직접 밑줄을 그어요."],
                ["질문에 답하기", "표시를 바탕으로 나온 짧은 질문에 답해요."],
                ["다음 문장", "답을 확인한 뒤 다음 문장도 같은 방법으로 살펴봐요."]
              ]).map(([label, description], index) => (
                <div className={index === (isPoem
                  ? literatureSelectionSubmitted ? 2 : selectedSentences.length > 0 ? 1 : 0
                  : novelAnswerSubmitted ? 2 : literatureSelectionSubmitted ? 1 : 0) ? "active" : ""} key={label}>
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
