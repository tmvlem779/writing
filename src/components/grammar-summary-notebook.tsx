"use client";

import { useState } from "react";
import {
  getGrammarSummaryFeedback,
  grammarSummarySections,
  isGrammarSummaryAnswerCorrect
} from "@/lib/curriculum/grammar-summary-notebook";

export function GrammarSummaryNotebook() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const blanks = grammarSummarySections.flatMap((section) => section.blanks);
  const filledCount = blanks.filter((blank) => answers[blank.id]?.trim()).length;
  const submittedCount = submittedIds.size;
  const correctCount = blanks.filter((blank) => (
    submittedIds.has(blank.id) && isGrammarSummaryAnswerCorrect(blank, answers[blank.id] ?? "")
  )).length;

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setSubmittedIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function checkAnswers() {
    setSubmittedIds(new Set(
      blanks
        .filter((blank) => answers[blank.id]?.trim())
        .map((blank) => blank.id)
    ));
  }

  return (
    <section className="summary-notebook" aria-labelledby="summary-notebook-title">
      <header>
        <div>
          <span>교과서 110~111쪽 · 파일 25~26쪽</span>
          <h2 id="summary-notebook-title">소단원 정리 노트</h2>
          <p>빈칸을 직접 채우며 1~5차시의 핵심 개념을 연결해 보세요.</p>
        </div>
        <strong>{filledCount} / {blanks.length}칸 작성</strong>
      </header>

      <div className="summary-notebook-sections">
        {grammarSummarySections.map((section) => (
          <article className={`summary-notebook-section summary-${section.id}`} key={section.id}>
            <div className="summary-section-heading">
              <span>{section.eyebrow}</span>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>
            <div className="summary-blank-table">
              {section.blanks.map((blank, index) => {
                const value = answers[blank.id] ?? "";
                const feedback = getGrammarSummaryFeedback(blank, value, submittedIds.has(blank.id));
                const feedbackId = `summary-feedback-${blank.id}`;
                return (
                  <label className={feedback ? `summary-blank-row ${feedback.kind}` : "summary-blank-row"} key={blank.id}>
                    <span className="summary-blank-number">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{blank.topic}</strong>
                    <span className="summary-blank-sentence">
                      {blank.before}
                      <input
                        aria-describedby={feedback ? feedbackId : undefined}
                        aria-label={`${section.title} ${blank.topic} 빈칸 ${index + 1}`}
                        autoComplete="off"
                        onChange={(event) => updateAnswer(blank.id, event.target.value)}
                        placeholder="직접 입력"
                        spellCheck={false}
                        value={value}
                      />
                      {blank.after}
                    </span>
                    {feedback && <small id={feedbackId}>{feedback.message}</small>}
                  </label>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="summary-notebook-actions">
        <p aria-live="polite">
          {submittedCount > 0
            ? `${submittedCount}개를 제출해 ${correctCount}개를 알맞게 정리했어요. 틀린 칸에만 표시된 힌트를 보고 다시 써 보세요.`
            : "정답을 먼저 보여 주지 않아요. 기억나는 표현을 써 본 뒤 확인해 보세요."}
        </p>
        <button className="secondary-button" disabled={filledCount === 0} onClick={checkAnswers} type="button">
          내 정리 확인하기
        </button>
      </div>
    </section>
  );
}
