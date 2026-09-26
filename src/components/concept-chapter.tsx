"use client";

import { useState } from "react";
import {
  advanceConceptCheck,
  canAdvanceConceptCheck,
  isConceptCheckComplete
} from "@/lib/curriculum/concept-check-flow";
import { getCourseLesson, type CourseLessonNumber, type CourseTrackId } from "@/lib/curriculum/five-lesson-course";
import {
  evaluateGrammarConceptCheck,
  grammarElementLessons,
  grammarElementsSource
} from "@/lib/curriculum/grammar-elements";
import {
  evaluateConceptCheck,
  sentenceStructureLessons,
  sentenceStructureSource
} from "@/lib/curriculum/sentence-structure";

type ConceptChapterProps = {
  lessonNumber: CourseLessonNumber;
  trackId: CourseTrackId;
  onStartPractice: () => void;
};

export function ConceptChapter({ lessonNumber, trackId, onStartPractice }: ConceptChapterProps) {
  const courseLesson = getCourseLesson(lessonNumber, trackId);
  const lessons = trackId === "grammar" ? grammarElementLessons : sentenceStructureLessons;
  const source = trackId === "grammar" ? grammarElementsSource : sentenceStructureSource;
  const lesson = lessons.find((item) => item.id === courseLesson.conceptLessonId) ?? lessons[0];
  const checks = [lesson.check, ...(lesson.extraChecks ?? [])];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [passedCheckIndexes, setPassedCheckIndexes] = useState<number[]>([]);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const currentCheck = checks[currentCheckIndex];
  const selectedAnswer = selectedAnswers[currentCheck.prompt] ?? "";
  const result = selectedAnswer
    ? trackId === "grammar"
      ? evaluateGrammarConceptCheck(lesson.id, selectedAnswer)
      : evaluateConceptCheck(lesson.id, selectedAnswer)
    : null;
  const completedChecks = passedCheckIndexes.length;
  const allChecksPassed = isConceptCheckComplete(checks.length, passedCheckIndexes);
  const canOpenNextCheck = canAdvanceConceptCheck(currentCheckIndex, checks.length, passedCheckIndexes);

  function selectCheckAnswer(optionId: string) {
    setSelectedAnswers((current) => ({ ...current, [currentCheck.prompt]: optionId }));
    if (optionId === currentCheck.answer) {
      setPassedCheckIndexes((current) => current.includes(currentCheckIndex)
        ? current
        : [...current, currentCheckIndex]);
    }
  }

  function openNextCheck() {
    setCurrentCheckIndex((current) => advanceConceptCheck(current, checks.length, passedCheckIndexes));
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
            {allChecksPassed && index === 2 && <i aria-label="확인 완료">✓</i>}
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
          <span className="concept-count">{lessonNumber} / 5차시</span>
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

        <section className="concept-check-set" aria-labelledby="check-set-heading">
          <header>
            <span id="check-set-heading">스스로 확인하기</span>
            <strong aria-live="polite">{completedChecks} / {checks.length}문항 통과</strong>
          </header>
          <p className="check-sequence-guide">
            문항 {currentCheckIndex + 1} / {checks.length} · {currentCheckIndex < checks.length - 1
              ? "현재 문항을 맞히면 다음 문항이 열려요."
              : "마지막 문항이에요."}
          </p>
          <fieldset className="concept-check" key={currentCheck.prompt}>
            <legend>
              <span>문항 {currentCheckIndex + 1}</span>
              {currentCheck.prompt}
            </legend>
            <div className="check-options">
              {currentCheck.options.map((option) => (
                <button
                  aria-pressed={selectedAnswer === option.id}
                  className={selectedAnswer === option.id ? "check-option selected" : "check-option"}
                  disabled={Boolean(result?.correct)}
                  key={option.id}
                  onClick={() => selectCheckAnswer(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {result && (
              <div className={result.correct ? "check-feedback correct" : "check-feedback retry"} aria-live="polite">
                <strong>{result.correct ? "맞았어요. 근거까지 확인해 볼까요?" : "정답을 바로 보기보다 단서를 다시 살펴보세요."}</strong>
                <p>{result.correct ? result.feedback : currentCheck.retryHint ?? lesson.inquiryQuestion}</p>
                <small>{result.reflection}</small>
              </div>
            )}
            {canOpenNextCheck && (
              <div className="check-next-row">
                <button className="secondary-button" onClick={openNextCheck} type="button">
                  다음 문항으로
                </button>
              </div>
            )}
            {allChecksPassed && (
              <p className="check-complete-message" role="status">모든 확인 문제를 통과했어요.</p>
            )}
          </fieldset>
        </section>

        <div className="concept-actions concept-actions-end">
          <button className="primary-button" onClick={onStartPractice} type="button">
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
