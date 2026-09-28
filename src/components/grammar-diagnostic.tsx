"use client";

import { useMemo, useState } from "react";
import { grammarDiagnosticQuestions, scoreDiagnosticAnswers } from "@/lib/diagnosis/grammar-diagnostic";
import { recordWrongAnswer, resolveWrongAnswer } from "@/lib/learning/wrong-answer-client";

type Feedback = { correct: boolean; message: string } | null;

export function GrammarDiagnostic() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const question = grammarDiagnosticQuestions[currentIndex];
  const score = scoreDiagnosticAnswers(answers);

  const domainResults = useMemo(() => {
    const domains = [...new Set(grammarDiagnosticQuestions.map((item) => item.domain))];
    return domains.map((domain) => {
      const items = grammarDiagnosticQuestions.filter((item) => item.domain === domain);
      const correct = items.filter((item) => answers[item.id] === item.answer).length;
      return { domain, correct, total: items.length };
    });
  }, [answers]);

  function submitAnswer() {
    if (!selected || feedback) return;
    const correct = selected === question.answer;
    const option = question.options.find((item) => item.id === selected);
    setAnswers((current) => ({ ...current, [question.id]: selected }));
    setFeedback({ correct, message: correct ? question.explanation : question.retryHint });

    if (correct) {
      void resolveWrongAnswer("diagnosis", question.id);
    } else {
      void recordWrongAnswer({
        source: "diagnosis",
        sourceLabel: "AI 진단평가",
        problemId: question.id,
        problemTitle: `${question.order}번 · ${question.domain}`,
        question: question.prompt,
        submittedAnswer: option?.label ?? selected,
        feedbackHint: question.retryHint
      });
    }
  }

  async function nextQuestion() {
    if (currentIndex === grammarDiagnosticQuestions.length - 1) {
      setSaving(true);
      setSaveMessage("");
      const completedAnswers = { ...answers, [question.id]: selected };
      try {
        const result = await fetch("/api/diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: completedAnswers })
        });
        if (!result.ok) setSaveMessage("결과를 저장하지 못했지만 화면에서 진단 결과를 확인할 수 있어요.");
      } catch {
        setSaveMessage("결과를 저장하지 못했지만 화면에서 진단 결과를 확인할 수 있어요.");
      } finally {
        setSaving(false);
      }
      setFinished(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelected("");
    setFeedback(null);
  }

  function restart() {
    setAnswers({});
    setCurrentIndex(0);
    setSelected("");
    setFeedback(null);
    setFinished(false);
    setSaveMessage("");
  }

  return (
    <div className="diagnostic-shell">
      <aside className="diagnostic-sidebar" aria-label="진단평가 문항 순서">
        <span>학습 흐름</span>
        <h2>문법 역량 진단</h2>
        <ol>
          {grammarDiagnosticQuestions.map((item, index) => (
            <li className={index === currentIndex && !finished ? "active" : answers[item.id] ? "done" : ""} key={item.id}>
              <i>{answers[item.id] ? "✓" : index + 1}</i>
              <p><strong>{item.domain}</strong><small>{item.level} 문항</small></p>
            </li>
          ))}
        </ol>
      </aside>

      <section className="diagnostic-workspace">
        {!finished ? (
          <>
            <header className="diagnostic-header">
              <div><span>AI 진단평가 · {question.level}</span><h1>문법 학습의 출발점을 찾아요</h1></div>
              <strong>{question.order} / {grammarDiagnosticQuestions.length}</strong>
            </header>
            <div className="diagnostic-progress" aria-label={`진단평가 ${question.order}/${grammarDiagnosticQuestions.length}`}><i style={{ width: `${(question.order / grammarDiagnosticQuestions.length) * 100}%` }} /></div>
            <article className="diagnostic-question-card">
              <span>{question.domain}</span>
              <h2>{question.prompt}</h2>
              <div className="diagnostic-options">
                {question.options.map((option) => (
                  <button
                    aria-pressed={selected === option.id}
                    className={selected === option.id ? "selected" : ""}
                    disabled={Boolean(feedback)}
                    key={option.id}
                    onClick={() => setSelected(option.id)}
                    type="button"
                  >
                    <i>{option.id.toUpperCase()}</i>{option.label}
                  </button>
                ))}
              </div>
              {feedback && (
                <div className={feedback.correct ? "diagnostic-feedback correct" : "diagnostic-feedback retry"} role="status">
                  <strong>{feedback.correct ? "이 개념을 알고 있어요." : "이 부분은 다시 살펴볼 개념이에요."}</strong>
                  <p>{feedback.message}</p>
                </div>
              )}
              <div className="diagnostic-actions">
                {!feedback ? (
                  <button className="primary-button" disabled={!selected} onClick={submitAnswer} type="button">답 확인하기</button>
                ) : (
                  <button className="primary-button" disabled={saving} onClick={nextQuestion} type="button">{saving ? "결과 저장 중…" : question.order === grammarDiagnosticQuestions.length ? "결과 보기" : "다음 문항"}</button>
                )}
              </div>
            </article>
          </>
        ) : (
          <section className="diagnostic-result" aria-labelledby="diagnostic-result-title">
            <span>진단 완료</span>
            <h1 id="diagnostic-result-title">현재 문법 학습 역량을 확인했어요</h1>
            <div className="diagnostic-score"><strong>{score}</strong><span>/ {grammarDiagnosticQuestions.length}문항</span></div>
            <p>정답 수만으로 끝내지 않고, 영역별 결과를 오늘의 챌린지와 오답노트에서 다시 활용해 보세요.</p>
            {saveMessage && <p className="form-message" role="status">{saveMessage}</p>}
            <div className="diagnostic-domain-grid">
              {domainResults.map((item) => (
                <article key={item.domain}><span>{item.domain}</span><strong>{item.correct}/{item.total}</strong><small>{item.correct === item.total ? "스스로 설명해 볼 영역" : "다시 살펴볼 영역"}</small></article>
              ))}
            </div>
            <div className="diagnostic-result-actions">
              <a className="primary-button" href="/learn/challenge">오늘의 챌린지로</a>
              <a className="secondary-button" href="/learn/wrong-notes">오답 확인하기</a>
              <button onClick={restart} type="button">다시 진단하기</button>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
