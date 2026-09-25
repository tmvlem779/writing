"use client";

import { useMemo, useState } from "react";
import { getCourseLesson, type CourseLessonNumber } from "@/lib/curriculum/five-lesson-course";
import {
  evaluateConceptCheck,
  sentenceStructureLessons,
  sentenceStructureSource
} from "@/lib/curriculum/sentence-structure";

type ConceptChapterProps = {
  lessonNumber: CourseLessonNumber;
  onStartPractice: () => void;
};

export function ConceptChapter({ lessonNumber, onStartPractice }: ConceptChapterProps) {
  const courseLesson = getCourseLesson(lessonNumber);
  const lesson = sentenceStructureLessons.find((item) => item.id === courseLesson.conceptLessonId) ?? sentenceStructureLessons[0];
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const result = useMemo(
    () => selectedAnswer ? evaluateConceptCheck(lesson.id, selectedAnswer) : null,
    [lesson.id, selectedAnswer]
  );

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
            {selectedAnswer && index === 2 && <i aria-label="확인 완료">✓</i>}
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
          <ul>
            {lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </section>

        <fieldset className="concept-check">
          <legend>
            <span>스스로 확인하기</span>
            {lesson.check.prompt}
          </legend>
          <div className="check-options">
            {lesson.check.options.map((option) => (
              <button
                aria-pressed={selectedAnswer === option.id}
                className={selectedAnswer === option.id ? "check-option selected" : "check-option"}
                key={option.id}
                onClick={() => setSelectedAnswer(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          {result && (
            <div className={result.correct ? "check-feedback correct" : "check-feedback retry"} aria-live="polite">
              <strong>{result.correct ? "맞았어요. 근거까지 확인해 볼까요?" : "한 번 더 관계를 살펴보세요."}</strong>
              <p>{result.correct ? result.feedback : lesson.inquiryQuestion}</p>
              <small>{result.reflection}</small>
            </div>
          )}
        </fieldset>

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
          {sentenceStructureSource.curriculum}의 「{sentenceStructureSource.section}」({sentenceStructureSource.pages})을 바탕으로 재구성했습니다.
        </p>
      </aside>
    </div>
  );
}
