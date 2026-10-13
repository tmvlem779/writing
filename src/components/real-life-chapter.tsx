"use client";

import { useEffect, useRef, useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";
import { getCourseLesson, getCourseTrack, type CourseLessonNumber, type CourseTrackId } from "@/lib/curriculum/five-lesson-course";
import {
  buildRealLifeCoreQuestions,
  buildRealLifeTask,
  getRealLifeMaterialGroup,
  getRealLifeLessonGuide,
  getRealLifeMaterialsForLesson,
  realLifePracticeModes,
  type RealLifeMaterialKind,
  type RealLifeMaterialGroup,
  type RealLifePracticeMode
} from "@/lib/curriculum/real-life-materials";

type Message = { role: "student" | "assistant"; content: string };
type SupportMode = "submit" | "hint";

type SavedRealLifeProgress = {
  mode: RealLifePracticeMode;
  completedModes: RealLifePracticeMode[];
  learningQuestionCount: number;
  draft: string;
  response: AgentResponse | null;
  history: Message[];
  scaffoldLevel: number;
  attemptCount: number;
  questionAttemptCount: number;
  questionHintCount: number;
};

const realLifeModeOrder: RealLifePracticeMode[] = ["structure", "effect", "rewrite"];

type NovelSentenceWork = {
  markedTokenIndexes: number[];
  relation: string;
  questionReady: boolean;
  answerSubmitted: boolean;
  draft: string;
  response: AgentResponse | null;
};

const novelStructureOptions = ["한 가지 내용", "둘 이상의 내용", "잘 모르겠어요"] as const;

function AiCoach({
  response,
  questionLabel = "다음 생각",
  className = ""
}: {
  response: AgentResponse;
  questionLabel?: string;
  className?: string;
}) {
  return (
    <article className={`coach-card ${className}`.trim()} aria-live="polite">
      <div className="coach-label"><span>AI 학습 도우미</span><small>{response.safety.blocked ? "안전 안내" : scaffoldLabel(response.scaffoldLevel)}</small></div>
      {response.questionResolution === "reveal_and_advance" ? (
        <div className="activity-resolution-card">
          <span>이 질문의 정답 확인</span>
          <strong>{response.resolvedQuestionAnswer}</strong>
          <p>{response.activityComplete ? "세 가지 핵심 질문을 모두 살펴봤어요." : "이 질문은 여기서 마치고 다음 질문으로 이어갈게요."}</p>
        </div>
      ) : response.activityComplete ? (
        <div className="activity-completion-card">
          <span>활동 완료</span>
          <strong>이번 과제의 근거와 설명을 모두 확인했어요.</strong>
        </div>
      ) : (
        <>
          <p>{response.studentMessage}</p>
          {response.question && (
            <div className="coach-question">
              <span>{response.safety.blocked ? "안전한 학습을 위한 안내" : questionLabel}</span>
              <strong>{response.question}</strong>
            </div>
          )}
        </>
      )}
      {response.focusConcepts.length > 0 && (
        <div className="concept-tags" aria-label="AI가 살펴본 개념">
          {response.focusConcepts.map((concept) => <span key={concept}>{concept}</span>)}
        </div>
      )}
    </article>
  );
}

type RealLifeChapterProps = {
  lessonNumber: CourseLessonNumber;
  trackId: CourseTrackId;
  showOverview?: boolean;
  materialGroup?: RealLifeMaterialGroup;
  initialMaterialId?: RealLifeMaterialKind;
  practiceDate?: string;
  dailyMode?: boolean;
  onDailyComplete?: (sessionId: string) => void | Promise<void>;
};

export function RealLifeChapter({
  lessonNumber,
  trackId,
  showOverview = true,
  materialGroup = "all",
  initialMaterialId,
  practiceDate,
  dailyMode = false,
  onDailyComplete
}: RealLifeChapterProps) {
  const courseLesson = getCourseLesson(lessonNumber, trackId);
  const track = getCourseTrack(trackId);
  const lessonGuide = getRealLifeLessonGuide(trackId);
  const availableMaterials = getRealLifeMaterialsForLesson(lessonNumber, trackId, materialGroup);
  const selectedDailyMaterials = initialMaterialId
    ? availableMaterials.filter((item) => item.id === initialMaterialId)
    : availableMaterials;
  const lessonMaterials = selectedDailyMaterials.length > 0 ? selectedDailyMaterials : availableMaterials;
  const [materialIndex, setMaterialIndex] = useState(0);
  const [mode, setMode] = useState<RealLifePracticeMode>("structure");
  const [completedModes, setCompletedModes] = useState<RealLifePracticeMode[]>([]);
  const [learningQuestionCount, setLearningQuestionCount] = useState(0);
  const [progressHydrated, setProgressHydrated] = useState(!dailyMode || !practiceDate);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [scaffoldLevel, setScaffoldLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [questionAttemptCount, setQuestionAttemptCount] = useState(0);
  const [questionHintCount, setQuestionHintCount] = useState(0);
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
  const [pendingAction, setPendingAction] = useState<SupportMode | null>(null);
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
  const selectedMode = realLifePracticeModes.find((item) => item.id === mode) ?? realLifePracticeModes[0];
  const sequentialDailyPractice = dailyMode && !isLiterature && Boolean(practiceDate);
  const coreQuestionPlan = buildRealLifeCoreQuestions(material, mode);
  const task = sequentialDailyPractice
    ? coreQuestionPlan[Math.min(learningQuestionCount, coreQuestionPlan.length - 1)]
    : buildRealLifeTask(material, mode);

  useEffect(() => {
    if (!sequentialDailyPractice || !practiceDate) return;
    const selectedPracticeDate = practiceDate;
    let active = true;
    async function restoreProgress() {
      try {
        const query = new URLSearchParams({ practiceDate: selectedPracticeDate, materialId: material.id });
        const result = await fetch(`/api/daily-practice/state?${query}`, { cache: "no-store" });
        const body = await result.json() as { state?: SavedRealLifeProgress | null; sessionId?: string; error?: string };
        if (!result.ok) throw new Error(body.error ?? "학습 진행을 불러오지 못했습니다.");
        if (!active || !body.state) return;
        const saved = body.state;
        const legacyRewriteQuestion = "고친 문장이 원래 문장보다 알아보기 쉬운 점을 하나만 쓰세요.";
        const currentRewriteQuestion = "방금 제출한 문장이 중요한 정보를 잘 보여 주는 이유를 하나만 쓰세요.";
        const restoredResponse = saved.response?.question === legacyRewriteQuestion
          ? { ...saved.response, question: currentRewriteQuestion }
          : saved.response;
        const restoredHistory = saved.history.map((message) => ({
          ...message,
          content: message.content.replace(legacyRewriteQuestion, currentRewriteQuestion)
        }));
        setMode(saved.mode);
        setCompletedModes([...new Set(saved.completedModes)]);
        setLearningQuestionCount(saved.learningQuestionCount);
        setDraft(saved.draft);
        setResponse(restoredResponse);
        setHistory(restoredHistory);
        setScaffoldLevel(saved.scaffoldLevel);
        setAttemptCount(saved.attemptCount);
        setQuestionAttemptCount(saved.questionAttemptCount);
        setQuestionHintCount(saved.questionHintCount);
        setSessionId(body.sessionId ?? null);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "학습 진행을 불러오지 못했습니다.");
      } finally {
        if (active) setProgressHydrated(true);
      }
    }
    void restoreProgress();
    return () => { active = false; };
  }, [material.id, practiceDate, sequentialDailyPractice]);

  async function persistProgress(id: string, state: SavedRealLifeProgress) {
    if (!sequentialDailyPractice || !practiceDate || id.startsWith("demo-")) return;
    const result = await fetch("/api/daily-practice/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, practiceDate, materialId: material.id, state })
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error ?? "학습 진행을 저장하지 못했습니다.");
  }

  function isModeUnlocked(nextMode: RealLifePracticeMode) {
    if (!sequentialDailyPractice) return true;
    const index = realLifeModeOrder.indexOf(nextMode);
    return index === 0 || completedModes.includes(realLifeModeOrder[index - 1]);
  }

  async function ensureSession() {
    if (sessionId) return sessionId;
    const result = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity: "authentic", learningArea: dailyMode ? "self-study" : "challenge" })
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error ?? "세션을 시작할 수 없습니다.");
    setSessionId(body.id);
    setDemo(Boolean(body.demo));
    return body.id as string;
  }

  async function sendTurn(submittedDraft: string, selectionTurn = false, supportMode: SupportMode = "submit") {
    const normalizedDraft = submittedDraft.trim();
    if (pending || (!selectionTurn && supportMode === "submit" && !normalizedDraft)) return;
    if (selectionTurn && (
      !isLiterature
      || literatureSelectionSubmitted
      || selectedSentences.length === 0
    )) return;
    setPending(true);
    setPendingAction(supportMode);
    setError("");
    try {
      const id = await ensureSession();
      const completionCriterion = isPoem
        ? "선택한 구절에서 문법 형태를 직접 찾고, 그 형태가 화자의 태도·시간·정서·시의 호흡에 주는 효과를 구절 근거와 함께 설명했다."
        : isLiterature
          ? `작품의 ${material.selectableSentences?.length ?? 0}개 문장 모두에서 구조 단서를 표시하고, 각 문장이 담은 내용과 표시한 근거를 짧게 설명했다.`
          : sequentialDailyPractice
            ? `${selectedMode.label}에서 서로 다른 핵심 질문 세 가지에 적절히 답했다. 부족한 답을 돕기 위한 보조 질문은 세 질문에 포함하지 않는다.`
            : "자료에서 근거 표현을 직접 찾고, 그 표현이 자료의 목적이나 독자에게 주는 효과를 한 가지 설명했다.";
      const currentQuestion = response?.question || (isLiterature && !isPoem ? novelGuideQuestion : isLiterature ? literatureTaskTitle : task);
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
        isLiterature && !isPoem
          ? `[현재까지 답을 확인한 문장] ${completedNovelSentenceIndexes.length}/${material.selectableSentences?.length ?? 0}`
          : null,
        isLiterature
          ? isPoem
            ? `[튜터 응답 원칙] 고른 구절을 구체적으로 반영해 한 번에 질문 하나만 제시할 것. 문법 요소의 형태를 먼저 찾게 하고, 그 요소가 화자의 태도·시간·정서·호흡에 만드는 효과로 질문을 넓힐 것. 완성 분석은 먼저 제시하지 말 것`
            : `[튜터 응답 원칙] 학생이 문장 안에 직접 밑줄 친 표현, 고른 구조, 짧은 답을 반영해 한두 문장으로 확인해 줄 것. 정답이나 완성 분석을 먼저 제시하지 말고, 다음 문장에서도 같은 방법으로 시도하도록 격려하는 짧은 질문으로 마칠 것`
          : null,
        sequentialDailyPractice ? `[학습 질문 진행] ${learningQuestionCount}/3` : null,
        sequentialDailyPractice ? `[현재 핵심 질문] ${coreQuestionPlan[Math.min(learningQuestionCount, 2)]}` : null,
        sequentialDailyPractice
          ? `[세 가지 핵심 질문]\n${coreQuestionPlan.map((question, index) => `${index + 1}. ${question}`).join("\n")}`
          : null,
        sequentialDailyPractice ? `[일일 활동 마지막 단계] ${mode === "rewrite" ? "예" : "아니요"}` : null,
        sequentialDailyPractice
          ? `[튜터 응답 원칙] 현재 핵심 질문에 정확히 답한 경우에만 아직 확인하지 않은 다음 핵심 질문으로 이동할 것. 일부만 맞거나 틀리거나 질문에 답하지 못했다면 핵심 질문 수를 늘리지 말고, 같은 목표를 한 단계 더 쉽게 묻는 보조 질문 하나를 제시할 것. 보조 질문은 세 가지 핵심 질문에 포함하지 않으며 정답을 먼저 말하지 말 것. 자료와 반대되거나 자료에 없는 답은 통과시키지 말 것.`
          : null,
        `[활동 완료 기준] ${completionCriterion}`,
        `[요청 유형] ${supportMode === "hint" ? "AI 힌트" : "도움 없이 제출"}`,
        `[학생 답]\n${selectionTurn ? `${literatureSelectionLabel} 선택을 제출함` : normalizedDraft || "아직 답을 쓰지 않았습니다."}`
      ].filter(Boolean).join("\n\n");
      const requestedScaffoldLevel = supportMode === "hint" ? Math.min(4, scaffoldLevel + 1) : scaffoldLevel;
      const result = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          activity: "authentic",
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
      const rawNext = body as AgentResponse & { demo?: boolean };
      const continuesSameQuestion = !selectionTurn
        && rawNext.questionResolution === "continue"
        && (sequentialDailyPractice || rawNext.question === currentQuestion);
      const nextQuestionAttemptCount = continuesSameQuestion && supportMode === "submit" && (rawNext.answerStatus === "incorrect" || rawNext.answerStatus === "partial")
        ? Math.min(20, questionAttemptCount + 1)
        : continuesSameQuestion ? questionAttemptCount : 0;
      const nextQuestionHintCount = continuesSameQuestion && supportMode === "hint"
        ? Math.min(20, questionHintCount + 1)
        : continuesSameQuestion ? questionHintCount : 0;
      const acceptedLearningQuestion = sequentialDailyPractice
        && !selectionTurn
        && (
          rawNext.questionResolution === "reveal_and_advance"
          || (supportMode === "submit" && (rawNext.questionResolution === "advance" || rawNext.questionResolution === "complete"))
        );
      const nextLearningQuestionCount = acceptedLearningQuestion
        ? Math.min(3, learningQuestionCount + 1)
        : learningQuestionCount;
      const next = acceptedLearningQuestion
        && !rawNext.activityComplete
        && nextLearningQuestionCount < coreQuestionPlan.length
        ? { ...rawNext, question: coreQuestionPlan[nextLearningQuestionCount] }
        : rawNext;
      const modeComplete = sequentialDailyPractice && next.activityComplete && nextLearningQuestionCount >= 3;
      const nextCompletedModes = modeComplete
        ? [...new Set([...completedModes, mode])]
        : completedModes;
      const nextAttemptCount = Math.min(20, attemptCount + 1);
      const nextHistory = [
        ...history,
        {
          role: "student" as const,
          content: supportMode === "hint"
            ? `힌트 요청: ${normalizedDraft || "작성 전"}`
            : selectionTurn
              ? isPoem
                ? `${literatureSelectionLabel} ${selectedSentences.length}개 선택: ${selectedSentences.join(" / ")}`
                : `${literatureSelectionLabel}: ${activeNovelSentence} / 밑줄: ${markedNovelTokenIndexes.map((index) => selectedNovelTokens[index]).filter(Boolean).join(" · ")} / 구조: ${novelRelation}`
              : normalizedDraft
        },
        { role: "assistant" as const, content: [next.studentMessage, next.resolvedQuestionAnswer, next.question].filter(Boolean).join(" ") }
      ].slice(-6);
      const clearDraft = !selectionTurn && (next.question !== currentQuestion || next.activityComplete);
      setResponse(next);
      setDemo((current) => current || Boolean(next.demo));
      setScaffoldLevel(next.scaffoldLevel);
      setAttemptCount(nextAttemptCount);
      setQuestionAttemptCount(nextQuestionAttemptCount);
      setQuestionHintCount(nextQuestionHintCount);
      setLearningQuestionCount(nextLearningQuestionCount);
      setCompletedModes(nextCompletedModes);
      if (selectionTurn) setLiteratureSelectionSubmitted(true);
      setAttemptedMaterials((current) => new Set(current).add(material.id));
      setHistory(nextHistory);
      if (isLiterature) {
        const novelSentenceComplete = !isPoem
          && !selectionTurn
          && supportMode === "submit"
          && (next.activityComplete || next.questionResolution === "advance");
        if (novelSentenceComplete) {
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
      }
      if (clearDraft) {
        setDraft("");
        requestAnimationFrame(() => draftRef.current?.focus());
      }
      if (sequentialDailyPractice) {
        await persistProgress(id, {
          mode,
          completedModes: nextCompletedModes,
          learningQuestionCount: nextLearningQuestionCount,
          draft: clearDraft ? "" : draft,
          response: next,
          history: nextHistory,
          scaffoldLevel: next.scaffoldLevel,
          attemptCount: nextAttemptCount,
          questionAttemptCount: nextQuestionAttemptCount,
          questionHintCount: nextQuestionHintCount
        });
      }
      const allModesComplete = realLifeModeOrder.every((item) => nextCompletedModes.includes(item));
      const dailySequenceComplete = sequentialDailyPractice && allModesComplete && next.activityComplete;
      const regularActivityComplete = !sequentialDailyPractice && supportMode === "submit" && next.activityComplete;
      if (!selectionTurn && (dailySequenceComplete || regularActivityComplete)) {
        await onDailyComplete?.(id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPending(false);
      setPendingAction(null);
    }
  }

  async function submit(supportMode: SupportMode) {
    await sendTurn(draft, false, supportMode);
  }

  async function submitLiteratureSelection() {
    await sendTurn("문장 다중 선택", true);
  }

  async function saveCurrentDraft() {
    if (!sequentialDailyPractice || !progressHydrated) return;
    try {
      const id = await ensureSession();
      await persistProgress(id, {
        mode,
        completedModes,
        learningQuestionCount,
        draft,
        response,
        history: history.slice(-6),
        scaffoldLevel,
        attemptCount,
        questionAttemptCount,
        questionHintCount
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "학습 진행을 저장하지 못했습니다.");
    }
  }

  function changeMaterial(index: number) {
    setMaterialIndex(index);
    setMode("structure");
    setCompletedModes([]);
    setLearningQuestionCount(0);
    setDraft("");
    setResponse(null);
    setSessionId(null);
    setHistory([]);
    setScaffoldLevel(0);
    setAttemptCount(0);
    setQuestionAttemptCount(0);
    setQuestionHintCount(0);
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
    setQuestionAttemptCount(0);
    setQuestionHintCount(0);
    setScaffoldLevel(saved?.response?.scaffoldLevel ?? 0);
    setHistory([]);
  }

  function advanceNovelSentence() {
    if (isPoem || !material.selectableSentences) return;
    if (novelSentenceIndex >= material.selectableSentences.length - 1) return;
    selectNovelSentence(novelSentenceIndex + 1);
  }

  function changeMode(nextMode: RealLifePracticeMode) {
    if (!isModeUnlocked(nextMode) || nextMode === mode) return;
    setMode(nextMode);
    setLearningQuestionCount(0);
    setDraft("");
    setResponse(null);
    setHistory([]);
    setAttemptCount(0);
    setQuestionAttemptCount(0);
    setQuestionHintCount(0);
    setScaffoldLevel(0);
    setError("");
    if (sessionId) {
      void persistProgress(sessionId, {
        mode: nextMode,
        completedModes,
        learningQuestionCount: 0,
        draft: "",
        response: null,
        history: [],
        scaffoldLevel: 0,
        attemptCount: 0,
        questionAttemptCount: 0,
        questionHintCount: 0
      }).catch((caught) => setError(caught instanceof Error ? caught.message : "학습 진행을 저장하지 못했습니다."));
    }
  }

  return (
    <div className="authentic-shell">
      <aside className="material-sidebar" aria-label={materialGroup === "literature" ? "문학 작품 목록" : `${lessonNumber}차시 실생활 자료`}>
        <div className="sidebar-heading">
          <span>{dailyMode ? "오늘의 문법 루틴" : materialGroup === "literature" ? "시·소설 질문·근거 탐구" : `Chapter 03 · ${lessonNumber}차시`}</span>
          <strong>{dailyMode ? "한 자료에 집중해요" : materialGroup === "literature" ? "답의 근거를 직접 찾아요" : courseLesson.title}</strong>
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
                        <AiCoach className="literature-coach" questionLabel="고른 구절을 바탕으로 한 질문" response={response} />
                      )}
                      {!response?.activityComplete && (
                        <>
                          <label className="draft-label" htmlFor="literature-followup-draft">질문에 대한 내 답</label>
                          <textarea id="literature-followup-draft" maxLength={2500} onChange={(event) => setDraft(event.target.value)} placeholder="선택한 구절의 문법 형태와 그 표현 효과를 근거로 답해 보세요." ref={draftRef} value={draft} />
                          <div className="editor-footer">
                            <span>{draft.length.toLocaleString()} / 2,500자</span>
                            <div className="editor-actions" aria-label="답 제출과 도움 선택">
                              <button aria-busy={pendingAction === "hint"} className="secondary-button hint-button" disabled={pending} onClick={() => submit("hint")} type="button">
                                {pendingAction === "hint" ? <MondeukLoading compact /> : "AI 힌트"}
                              </button>
                              <button aria-busy={pendingAction === "submit"} className="primary-button" disabled={pending || !draft.trim()} onClick={() => submit("submit")} type="button">
                                {pendingAction === "submit" ? <MondeukLoading compact /> : "제출"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
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
                          <div className="coach-label"><span>AI 학습 도우미</span><small>짧게 답해요</small></div>
                          <p>밑줄 친 부분과 ‘{novelRelation}’ 선택을 바탕으로 생각해 보세요.</p>
                          <div className="coach-question"><span>한 문장 질문</span><strong>{novelGuideQuestion}</strong></div>
                        </article>
                      )}
                      {response && (
                        <AiCoach className="literature-coach" questionLabel="이 문장 확인" response={response} />
                      )}
                      {!novelAnswerSubmitted ? (
                        <>
                          <label className="draft-label" htmlFor="literature-followup-draft">질문에 대한 내 답</label>
                          <textarea id="literature-followup-draft" maxLength={600} onChange={(event) => setDraft(event.target.value)} placeholder="한두 문장으로 짧게 답해 보세요." ref={draftRef} value={draft} />
                          <div className="editor-footer">
                            <span>{draft.length.toLocaleString()} / 600자</span>
                            <div className="editor-actions" aria-label="답 제출과 도움 선택">
                              <button aria-busy={pendingAction === "hint"} className="secondary-button hint-button" disabled={pending} onClick={() => submit("hint")} type="button">
                                {pendingAction === "hint" ? <MondeukLoading compact /> : "AI 힌트"}
                              </button>
                              <button aria-busy={pendingAction === "submit"} className="primary-button" disabled={pending || !draft.trim()} onClick={() => submit("submit")} type="button">
                                {pendingAction === "submit" ? <MondeukLoading compact /> : "제출"}
                              </button>
                            </div>
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
              {realLifePracticeModes.map((item) => {
                const unlocked = isModeUnlocked(item.id);
                const complete = completedModes.includes(item.id);
                return (
                  <button
                    aria-label={`${item.label} ${complete ? "완료" : unlocked ? "학습 가능" : "앞 활동 완료 후 열림"}`}
                    aria-pressed={mode === item.id}
                    className={`practice-mode${mode === item.id ? " active" : ""}${complete ? " complete" : ""}${!unlocked ? " locked" : ""}`}
                    disabled={!progressHydrated || !unlocked}
                    key={item.id}
                    onClick={() => changeMode(item.id)}
                    type="button"
                  >
                    <strong>{item.label}{complete ? " ✓" : !unlocked ? " · 잠김" : ""}</strong>
                    <small>{unlocked ? item.description : "앞 활동을 마치면 열려요."}</small>
                  </button>
                );
              })}
            </div>

            <div className="real-life-task">
              <span>{selectedMode.label} 과제</span>
              <p>{task}</p>
            </div>

            {response && (
              <AiCoach response={response} />
            )}

            {sequentialDailyPractice && !response?.activityComplete && (
              <p className="real-life-question-progress">핵심 질문 <strong>{Math.min(learningQuestionCount + 1, 3)}</strong>/3 · 보조 질문은 횟수에 포함하지 않아요.</p>
            )}

            {sequentialDailyPractice && response?.activityComplete && mode !== "rewrite" && (
              <div className="real-life-mode-complete">
                <span>{selectedMode.label} 활동을 마쳤어요.</span>
                <button className="primary-button" onClick={() => changeMode(realLifeModeOrder[realLifeModeOrder.indexOf(mode) + 1])} type="button">
                  다음: {realLifePracticeModes[realLifeModeOrder.indexOf(mode) + 1]?.label}
                </button>
              </div>
            )}

            {!response?.activityComplete && (
              <>
                <label className="draft-label" htmlFor="real-life-draft">내 생각과 고쳐 쓴 문장</label>
                <textarea
                  id="real-life-draft"
                  maxLength={2500}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => void saveCurrentDraft()}
                  placeholder="자료에서 찾은 근거와 내 판단을 먼저 적어 보세요. 고쳐 쓰기에서는 바꾼 이유도 함께 설명해 보세요."
                  ref={draftRef}
                  value={draft}
                />
                <div className="editor-footer">
                  <span>{draft.length.toLocaleString()} / 2,500자</span>
                  <div className="editor-actions" aria-label="답 제출과 도움 선택">
                    <button aria-busy={pendingAction === "hint"} className="secondary-button hint-button" disabled={pending} onClick={() => submit("hint")} type="button">
                      {pendingAction === "hint" ? <MondeukLoading compact /> : "AI 힌트"}
                    </button>
                    <button aria-busy={pendingAction === "submit"} className="primary-button" disabled={pending || !draft.trim()} onClick={() => submit("submit")} type="button">
                      {pendingAction === "submit" ? <MondeukLoading compact /> : "제출"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && <div className="error-panel" role="alert">{error}</div>}
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
