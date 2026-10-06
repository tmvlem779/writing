"use client";

import { useState } from "react";
import {
  advanceConceptCheck,
  canCompleteConceptChapter,
  canAdvanceConceptCheck,
  getConceptCheckSummary,
  getNextUnresolvedConceptCheck,
  isConceptCheckComplete
} from "@/lib/curriculum/concept-check-flow";
import { getCourseLesson, getCourseLessons, type CourseLessonNumber, type CourseTrackId } from "@/lib/curriculum/five-lesson-course";
import {
  evaluateGrammarConceptCheck,
  grammarElementLessons,
  grammarElementsSource
} from "@/lib/curriculum/grammar-elements";
import { GrammarSummaryNotebook } from "@/components/grammar-summary-notebook";
import {
  evaluateConceptCheck,
  sentenceStructureLessons,
  sentenceStructureSource
} from "@/lib/curriculum/sentence-structure";
import { recordWrongAnswer, resolveWrongAnswer } from "@/lib/learning/wrong-answer-client";

type ConceptChapterProps = {
  completed: boolean;
  lessonNumber: CourseLessonNumber;
  trackId: CourseTrackId;
  onCompletionChange: (complete: boolean) => void;
  onStartPractice: () => void;
};

export function ConceptChapter({ completed, lessonNumber, trackId, onCompletionChange, onStartPractice }: ConceptChapterProps) {
  const courseLesson = getCourseLesson(lessonNumber, trackId);
  const courseLessonCount = getCourseLessons(trackId).length;
  const lessons = trackId === "grammar" ? grammarElementLessons : sentenceStructureLessons;
  const source = trackId === "grammar" ? grammarElementsSource : sentenceStructureSource;
  const lesson = lessons.find((item) => item.id === courseLesson.conceptLessonId) ?? lessons[0];
  const checks = [lesson.check, ...(lesson.extraChecks ?? [])];
  const summaryRequired = trackId === "grammar" && lessonNumber === 6;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<Record<string, string>>({});
  const [submittedCheckIndexes, setSubmittedCheckIndexes] = useState<number[]>(
    () => completed ? checks.map((_, index) => index) : []
  );
  const [firstAttemptResults, setFirstAttemptResults] = useState<Record<number, boolean>>(
    () => completed ? Object.fromEntries(checks.map((_, index) => [index, true])) : {}
  );
  const [passedCheckIndexes, setPassedCheckIndexes] = useState<number[]>(
    () => completed ? checks.map((_, index) => index) : []
  );
  const [currentCheckIndex, setCurrentCheckIndex] = useState(() => completed ? checks.length - 1 : 0);
  const [summaryNotebookComplete, setSummaryNotebookComplete] = useState(() => completed);
  const currentCheck = checks[currentCheckIndex];
  const selectedAnswer = selectedAnswers[currentCheck.prompt] ?? "";
  const evaluatedAnswer = evaluatedAnswers[currentCheck.prompt] ?? "";
  const result = evaluatedAnswer
    ? trackId === "grammar"
      ? evaluateGrammarConceptCheck(lesson.id, evaluatedAnswer)
      : evaluateConceptCheck(lesson.id, evaluatedAnswer)
    : null;
  const completedChecks = passedCheckIndexes.length;
  const allChecksPassed = isConceptCheckComplete(checks.length, passedCheckIndexes);
  const chapterComplete = canCompleteConceptChapter(allChecksPassed, summaryRequired, summaryNotebookComplete);
  const initialCorrectIndexes = Object.entries(firstAttemptResults)
    .filter(([, correct]) => correct)
    .map(([index]) => Number(index));
  const checkSummary = getConceptCheckSummary(checks.length, submittedCheckIndexes, initialCorrectIndexes);
  const canOpenNextCheck = canAdvanceConceptCheck(currentCheckIndex, checks.length, submittedCheckIndexes);
  const currentWasSubmitted = submittedCheckIndexes.includes(currentCheckIndex);
  const currentIsPassed = passedCheckIndexes.includes(currentCheckIndex);
  const currentIsLocked = !checkSummary.initialRoundComplete && currentWasSubmitted;
  const nextUnresolvedCheck = getNextUnresolvedConceptCheck(checks.length, passedCheckIndexes);

  function selectCheckAnswer(optionId: string) {
    setSelectedAnswers((current) => ({ ...current, [currentCheck.prompt]: optionId }));
    if (checkSummary.initialRoundComplete && !currentIsPassed) {
      setEvaluatedAnswers((current) => {
        const next = { ...current };
        delete next[currentCheck.prompt];
        return next;
      });
    }
  }

  function submitCheckAnswer() {
    if (!selectedAnswer || currentIsLocked || result?.correct) return;
    setEvaluatedAnswers((current) => ({ ...current, [currentCheck.prompt]: selectedAnswer }));
    const problemId = `${trackId}-${lessonNumber}-${lesson.id}-check-${currentCheckIndex + 1}`;
    const selectedOption = currentCheck.options.find((option) => option.id === selectedAnswer);
    const correct = selectedAnswer === currentCheck.answer;
    const firstSubmission = !submittedCheckIndexes.includes(currentCheckIndex);
    if (firstSubmission) {
      setSubmittedCheckIndexes((current) => [...current, currentCheckIndex]);
      setFirstAttemptResults((current) => ({ ...current, [currentCheckIndex]: correct }));
    }
    if (correct && !passedCheckIndexes.includes(currentCheckIndex)) {
      void resolveWrongAnswer("challenge", problemId);
      const nextPassedCheckIndexes = [...passedCheckIndexes, currentCheckIndex];
      setPassedCheckIndexes(nextPassedCheckIndexes);
      const nextChecksComplete = isConceptCheckComplete(checks.length, nextPassedCheckIndexes);
      if (canCompleteConceptChapter(nextChecksComplete, summaryRequired, summaryNotebookComplete)) {
        onCompletionChange(true);
      }
    } else if (!correct) {
      void recordWrongAnswer({
        source: "challenge",
        sourceLabel: "오늘의 챌린지",
        problemId,
        problemTitle: `${lessonNumber}차시 · ${lesson.title} · 문항 ${currentCheckIndex + 1}`,
        question: currentCheck.prompt,
        submittedAnswer: selectedOption?.label ?? selectedAnswer,
        feedbackHint: currentCheck.retryHint ?? lesson.inquiryQuestion
      });
    }
  }

  function updateSummaryNotebookCompletion(complete: boolean) {
    setSummaryNotebookComplete(complete);
    onCompletionChange(canCompleteConceptChapter(allChecksPassed, summaryRequired, complete));
  }

  function openNextCheck() {
    setCurrentCheckIndex((current) => advanceConceptCheck(current, checks.length, submittedCheckIndexes));
  }

  function openWrongAnswerRetry() {
    const nextIndex = getNextUnresolvedConceptCheck(checks.length, passedCheckIndexes);
    if (nextIndex === null) return;
    const nextPrompt = checks[nextIndex].prompt;
    setCurrentCheckIndex(nextIndex);
    setSelectedAnswers((current) => ({ ...current, [nextPrompt]: "" }));
    setEvaluatedAnswers((current) => {
      const next = { ...current };
      delete next[nextPrompt];
      return next;
    });
  }

  return (
    <div className="concept-shell">
      <aside className="concept-sidebar" aria-label={`${lessonNumber}차시 1장 학습 순서`}>
        <div className="sidebar-heading">
          <span>Chapter 01 · {lessonNumber}차시</span>
          <strong>개념 학습</strong>
        </div>
        {["관찰하기", "개념 정리", "확인·설명"].map((step, index) => (
          <div className="concept-step active" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>{step}</span>
            {chapterComplete && index === 2 && <i aria-label="확인 완료">✓</i>}
          </div>
        ))}
      </aside>

      <section className="concept-workspace" aria-labelledby="concept-title">
        <header className="concept-header">
          <div>
            <span className="eyebrow">{lessonNumber}차시 · 관찰하고 설명하기</span>
            <h1 id="concept-title">{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <span className="concept-count">{lessonNumber} / {courseLessonCount}차시</span>
        </header>

        <section className="lesson-question-card" aria-label={`${lessonNumber}차시 핵심 질문`}>
          <span>핵심 질문</span>
          <strong>{courseLesson.keyQuestion}</strong>
        </section>

        <section className="inquiry-card" aria-labelledby="inquiry-heading">
          <span id="inquiry-heading">먼저 살펴보기</span>
          <h2>{lesson.inquiryQuestion}</h2>
          <div className="example-stack">
            {lesson.examples.map((example) => (
              <article key={example.sentence}>
                <strong>{example.sentence}</strong>
                <p>{example.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="concept-summary-card" aria-labelledby="summary-heading">
          <span id="summary-heading">개념 정리</span>
          {lesson.conceptSections ? (
            <div className="concept-section-grid">
              {lesson.conceptSections.map((section, index) => (
                <article className="concept-detail-section" key={section.title}>
                  <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{section.title}</h3></div>
                  {section.description && <p>{section.description}</p>}
                  <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>
                </article>
              ))}
            </div>
          ) : (
            <ul>
              {lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          )}
        </section>

        {summaryRequired && <GrammarSummaryNotebook onCompletionChange={updateSummaryNotebookCompletion} />}

        <section className="concept-check-set" aria-labelledby="check-set-heading">
          <header>
            <span id="check-set-heading">스스로 확인하기</span>
            <strong aria-live="polite">{completedChecks} / {checks.length}문항 해결</strong>
          </header>
          <p className="check-sequence-guide">
            문항 {currentCheckIndex + 1} / {checks.length} · {!checkSummary.initialRoundComplete
              ? "먼저 세 문항에 모두 답한 뒤 정오답을 확인해요."
              : allChecksPassed ? "세 문항을 모두 해결했어요." : "틀린 문항을 다시 해결해요."}
          </p>
          {checkSummary.initialRoundComplete && (
            <section className="check-result-summary" aria-label="스스로 확인하기 최초 정오답 결과">
              <div>
                <span>1차 결과</span>
                <strong>{checkSummary.correctCount} / {checks.length} 정답</strong>
              </div>
              <ol>
                {checks.map((check, index) => (
                  <li className={firstAttemptResults[index] ? "correct" : "incorrect"} key={check.prompt}>
                    <span>문항 {index + 1}</span>
                    <strong>{firstAttemptResults[index] ? "정답" : "오답"}</strong>
                  </li>
                ))}
              </ol>
              {!allChecksPassed && nextUnresolvedCheck !== null && currentCheckIndex !== nextUnresolvedCheck && (
                <button className="secondary-button" onClick={openWrongAnswerRetry} type="button">오답 다시 풀기</button>
              )}
            </section>
          )}
          <fieldset className="concept-check" key={currentCheck.prompt}>
            <legend className="concept-check-legend">
              문항 {currentCheckIndex + 1}: {currentCheck.prompt}
            </legend>
            <div className="concept-check-question" aria-hidden="true">
              <span>문항 {currentCheckIndex + 1}</span>
              <strong>{currentCheck.prompt}</strong>
            </div>
            <div className="check-options">
              {currentCheck.options.map((option) => (
                <button
                  aria-pressed={selectedAnswer === option.id}
                  className={selectedAnswer === option.id ? "check-option selected" : "check-option"}
                  disabled={currentIsPassed || currentIsLocked}
                  key={option.id}
                  onClick={() => selectCheckAnswer(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {!currentIsPassed && !currentIsLocked && !result?.correct && (
              <div className="check-submit-row">
                <button className="primary-button" disabled={!selectedAnswer} onClick={submitCheckAnswer} type="button">
                  답 제출
                </button>
              </div>
            )}
            {result && (
              <div className={result.correct ? "check-feedback correct" : "check-feedback retry"} aria-live="polite">
                <strong>{result.correct ? "맞았어요. 근거까지 확인해 볼까요?" : "정답을 바로 보기보다 단서를 다시 살펴보세요."}</strong>
                <p>{result.correct ? result.feedback : currentCheck.retryHint ?? lesson.inquiryQuestion}</p>
                <small>{result.reflection}</small>
              </div>
            )}
            {!checkSummary.initialRoundComplete && canOpenNextCheck && (
              <div className="check-next-row">
                <button className="secondary-button" onClick={openNextCheck} type="button">
                  다음 문항으로
                </button>
              </div>
            )}
            {checkSummary.initialRoundComplete && result?.correct && nextUnresolvedCheck !== null && (
              <div className="check-next-row">
                <button className="secondary-button" onClick={openWrongAnswerRetry} type="button">
                  다음 오답 풀기
                </button>
              </div>
            )}
            {allChecksPassed && (
              <p className="check-complete-message" role="status">모든 확인 문제를 통과했어요.</p>
            )}
          </fieldset>
        </section>

        <div className="concept-actions concept-actions-end">
          {!chapterComplete && (
            <p className="chapter-lock-message" role="status">
              {summaryRequired
                ? "정리 노트의 모든 빈칸을 맞히고 스스로 확인하기의 모든 문항을 통과하면 Chapter 02가 열려요."
                : "스스로 확인하기의 모든 문항을 통과하면 Chapter 02가 열려요."}
            </p>
          )}
          <button className="primary-button" disabled={!chapterComplete} onClick={onStartPractice} type="button">
            이 차시의 2장 연습으로
          </button>
        </div>
      </section>

      <aside className="concept-progress" aria-label={`${lessonNumber}차시 주요 활동`}>
        <span className="panel-kicker">{lessonNumber}차시 학습 지도</span>
        <h2>{courseLesson.title}</h2>
        <ol>
          {courseLesson.activities.map((activity, index) => (
            <li key={activity}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {activity}
            </li>
          ))}
        </ol>
        <p className="source-note">
          {source.curriculum}의 「{source.section}」({source.pages})을 바탕으로 재구성했습니다.
        </p>
      </aside>
    </div>
  );
}
