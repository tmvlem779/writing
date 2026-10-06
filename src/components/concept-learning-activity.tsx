"use client";

import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { getDiagnosticQuestion, grammarDiagnosticQuestions } from "@/lib/diagnosis/grammar-diagnostic";
import { recordWrongAnswer, resolveWrongAnswer } from "@/lib/learning/wrong-answer-client";

type ConceptLearningActivityProps = {
  questionId: string;
  onDailyComplete?: (sessionId: string) => void | Promise<void>;
};

type Feedback = { correct: boolean; message: string } | null;

export function ConceptLearningActivity({ questionId, onDailyComplete }: ConceptLearningActivityProps) {
  const question = getDiagnosticQuestion(questionId) ?? grammarDiagnosticQuestions[0];
  const problemId = `daily-concept-${question.id}`;
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function createSession() {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity: "diagnose", learningArea: "self-study" })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "개념학습을 시작할 수 없습니다.");
    return body.id as string;
  }

  async function checkAnswer() {
    if (!selected || pending) return;
    const correct = selected === question.answer;
    const option = question.options.find((item) => item.id === selected);
    setAttemptCount((count) => count + 1);
    setError("");

    if (!correct) {
      setFeedback({ correct: false, message: question.retryHint });
      void recordWrongAnswer({
        source: "self-study",
        sourceLabel: "스스로 유형 학습 · 개념학습",
        problemId,
        problemTitle: question.domain,
        question: question.prompt,
        submittedAnswer: option?.label ?? selected,
        feedbackHint: question.retryHint
      });
      return;
    }

    setPending(true);
    try {
      const sessionId = await createSession();
      await resolveWrongAnswer("self-study", problemId);
      await onDailyComplete?.(sessionId);
      setFeedback({ correct: true, message: question.explanation });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "학습 완료 기록을 저장하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  function chooseAnswer(optionId: string) {
    if (feedback?.correct || pending) return;
    setSelected(optionId);
    setFeedback(null);
  }

  return (
    <section className="daily-concept-shell" aria-labelledby="daily-concept-title">
      <header>
        <div><span>관찰 → 판단 → 단서 → 설명</span><h2 id="daily-concept-title">문장을 보고 개념을 찾아요</h2></div>
        <strong>{question.domain} · {question.level}</strong>
      </header>

      <article className="daily-concept-card">
        <span>오늘의 개념 질문</span>
        <h3>{question.prompt}</h3>
        <div className="daily-concept-options">
          {question.options.map((option) => (
            <button
              aria-pressed={selected === option.id}
              className={selected === option.id ? "selected" : ""}
              disabled={Boolean(feedback?.correct) || pending}
              key={option.id}
              onClick={() => chooseAnswer(option.id)}
              type="button"
            >
              <i>{option.id.toUpperCase()}</i><span>{option.label}</span>
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`daily-concept-feedback ${feedback.correct ? "correct" : "retry"}`} role="status">
            <strong>{feedback.correct ? "스스로 개념을 찾았어요!" : "한 번 더 살펴볼까요?"}</strong>
            <p>{feedback.message}</p>
          </div>
        )}

        <footer>
          <span>{attemptCount === 0 ? "먼저 내 힘으로 판단해 보세요. 틀린 뒤에만 단서가 열립니다." : `${attemptCount}회 생각했어요.`}</span>
          <button
            aria-busy={pending}
            className="primary-button"
            disabled={!selected || Boolean(feedback?.correct) || pending}
            onClick={checkAnswer}
            type="button"
          >
            {pending ? <MondeukLoading compact /> : feedback ? "다시 확인하기" : "답 확인하기"}
          </button>
        </footer>
        {error && <div className="error-panel" role="alert">{error}</div>}
      </article>
    </section>
  );
}
