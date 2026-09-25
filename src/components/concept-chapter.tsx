"use client";

import { useMemo, useState } from "react";
import {
  evaluateConceptCheck,
  sentenceStructureLessons,
  sentenceStructureSource
} from "@/lib/curriculum/sentence-structure";

type ConceptChapterProps = {
  onStartPractice: () => void;
};

export function ConceptChapter({ onStartPractice }: ConceptChapterProps) {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const lesson = sentenceStructureLessons[lessonIndex];
  const selectedAnswer = answers[lesson.id];
  const result = useMemo(
    () => selectedAnswer ? evaluateConceptCheck(lesson.id, selectedAnswer) : null,
    [lesson.id, selectedAnswer]
  );
  const completedCount = Object.keys(answers).length;

  function selectLesson(index: number) {
    setLessonIndex(index);
  }

  function selectAnswer(optionId: string) {
    setAnswers((current) => ({ ...current, [lesson.id]: optionId }));
  }

  return (
    <div className="concept-shell">
      <aside className="concept-sidebar" aria-label="1장 개념 차례">
        <div className="sidebar-heading">
          <span>Chapter 01</span>
          <strong>문장의 구조 개념</strong>
        </div>
        {sentenceStructureLessons.map((item, index) => (
          <button
            aria-current={lesson.id === item.id ? "step" : undefined}
            className={lesson.id === item.id ? "concept-step active" : "concept-step"}
            key={item.id}
            onClick={() => selectLesson(index)}
            type="button"
          >
            <span>{String(item.step).padStart(2, "0")}</span>
            <span>{item.title}</span>
            {answers[item.id] && <i aria-label="확인 완료">✓</i>}
          </button>
        ))}
      </aside>

      <section className="concept-workspace" aria-labelledby="concept-title">
        <header className="concept-header">
          <div>
            <span className="eyebrow">개념 {lesson.step} · 관찰하고 설명하기</span>
            <h1 id="concept-title">{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <span className="concept-count">{lesson.step} / {sentenceStructureLessons.length}</span>
        </header>

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
                onClick={() => selectAnswer(option.id)}
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

        <div className="concept-actions">
          <button
            className="secondary-button"
            disabled={lessonIndex === 0}
            onClick={() => setLessonIndex((index) => Math.max(0, index - 1))}
            type="button"
          >
            이전 개념
          </button>
          {lessonIndex < sentenceStructureLessons.length - 1 ? (
            <button
              className="primary-button"
              onClick={() => setLessonIndex((index) => Math.min(sentenceStructureLessons.length - 1, index + 1))}
              type="button"
            >
              다음 개념
            </button>
          ) : (
            <button className="primary-button" onClick={onStartPractice} type="button">
              2장 활동 시작
            </button>
          )}
        </div>
      </section>

      <aside className="concept-progress" aria-label="개념 학습 진행">
        <span className="panel-kicker">개념 지도</span>
        <h2>{completedCount} / {sentenceStructureLessons.length} 확인</h2>
        <div className="progress-ring" aria-label={`개념 확인 ${completedCount}/${sentenceStructureLessons.length}`}>
          <strong>{Math.round((completedCount / sentenceStructureLessons.length) * 100)}%</strong>
        </div>
        <ol>
          {sentenceStructureLessons.map((item) => (
            <li className={answers[item.id] ? "done" : ""} key={item.id}>
              <span>{answers[item.id] ? "완료" : `0${item.step}`}</span>
              {item.title}
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
