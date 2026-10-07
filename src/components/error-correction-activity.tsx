"use client";

import { useMemo, useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { getErrorCorrectionItem } from "@/lib/curriculum/error-correction";
import { recordWrongAnswer, resolveWrongAnswer } from "@/lib/learning/wrong-answer-client";

type ErrorCorrectionActivityProps = {
  itemId: string;
  onDailyComplete?: (sessionId: string) => void | Promise<void>;
};

type Feedback = { kind: "retry" | "success"; message: string } | null;

function normalizeSentence(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[“”‘’'".,!?]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function sameIndexes(selected: number[], expected: number[]) {
  return selected.length === expected.length
    && [...selected].sort((a, b) => a - b).every((value, index) => value === [...expected].sort((a, b) => a - b)[index]);
}

export function ErrorCorrectionActivity({ itemId, onDailyComplete }: ErrorCorrectionActivityProps) {
  const item = getErrorCorrectionItem(itemId);
  const problemId = `daily-error-${item.id}`;
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [correction, setCorrection] = useState("");
  const [reason, setReason] = useState("");
  const [selectionFeedback, setSelectionFeedback] = useState<Feedback>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<Feedback>(null);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const acceptedCorrections = useMemo(
    () => item.acceptedCorrections.map(normalizeSentence),
    [item.acceptedCorrections]
  );

  function toggleToken(index: number) {
    if (selectionConfirmed || pending || completed) return;
    setSelectedIndexes((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);
    setSelectionFeedback(null);
  }

  function checkSelection() {
    if (selectedIndexes.length === 0 || pending) return;
    if (!sameIndexes(selectedIndexes, item.incorrectTokenIndexes)) {
      setSelectionFeedback({ kind: "retry", message: item.selectionHint });
      void recordWrongAnswer({
        source: "self-study",
        sourceLabel: "스스로 유형 학습 · 틀린 문장 고치기",
        problemId,
        problemTitle: item.title,
        question: `${item.tokens.join(" ")}에서 문법적으로 잘못된 부분을 찾으세요.`,
        submittedAnswer: selectedIndexes.map((index) => item.tokens[index]).join(" / "),
        feedbackHint: item.selectionHint
      });
      return;
    }
    setSelectionConfirmed(true);
    setSelectionFeedback({ kind: "success", message: "틀린 부분을 찾았어요. 이제 문장을 직접 고치고 그 이유를 설명해 보세요." });
  }

  async function createSession() {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity: "error", learningArea: "self-study" })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "오류 문장 학습을 시작할 수 없습니다.");
    return body.id as string;
  }

  async function submitRevision() {
    if (!correction.trim() || !reason.trim() || pending || completed) return;
    setRevisionFeedback(null);
    setError("");

    if (!acceptedCorrections.includes(normalizeSentence(correction))) {
      setRevisionFeedback({ kind: "retry", message: item.correctionHint });
      return;
    }

    const normalizedReason = reason.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
    if (!item.reasonKeywords.some((keyword) => normalizedReason.includes(normalizeSentence(keyword)))) {
      setRevisionFeedback({ kind: "retry", message: item.reasonHint });
      return;
    }

    setPending(true);
    try {
      const sessionId = await createSession();
      await resolveWrongAnswer("self-study", problemId);
      await onDailyComplete?.(sessionId);
      setCompleted(true);
      setRevisionFeedback({ kind: "success", message: item.explanation });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "학습 완료를 기록하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="error-correction-shell" aria-labelledby="error-correction-title">
      <header>
        <div><span>찾기 → 고치기 → 이유 설명</span><h2 id="error-correction-title">틀린 문장을 내 힘으로 고쳐요</h2></div>
        <strong>{item.focus}</strong>
      </header>

      <article className="error-correction-card">
        <div className="error-correction-context"><span>상황</span><p>{item.context}</p></div>

        <section className="error-correction-stage" aria-labelledby="error-mark-title">
          <span>1. 틀린 부분 찾기</span>
          <h3 id="error-mark-title">문법적으로 잘못된 부분을 골라 밑줄을 그어 보세요.</h3>
          <div className="error-token-line" aria-label="오류가 있는 문장">
            {item.tokens.map((token, index) => (
              <button
                aria-pressed={selectedIndexes.includes(index)}
                className={selectedIndexes.includes(index) ? "marked" : ""}
                disabled={selectionConfirmed || completed}
                key={`${token}-${index}`}
                onClick={() => toggleToken(index)}
                type="button"
              >
                {token}
              </button>
            ))}
          </div>
          {selectionFeedback && (
            <div className={`error-correction-feedback ${selectionFeedback.kind}`} role="status">
              <strong>{selectionFeedback.kind === "success" ? "찾았어요!" : "한 번 더 살펴볼까요?"}</strong>
              <p>{selectionFeedback.message}</p>
            </div>
          )}
          {!selectionConfirmed && (
            <button className="secondary-button" disabled={selectedIndexes.length === 0} onClick={checkSelection} type="button">밑줄 확인하기</button>
          )}
        </section>

        {selectionConfirmed && (
          <section className="error-correction-stage" aria-labelledby="error-revise-title">
            <span>2. 바르게 고치고 이유 쓰기</span>
            <h3 id="error-revise-title">문장 전체를 바르게 고친 뒤, 왜 고쳤는지 설명해 보세요.</h3>
            <label htmlFor="corrected-sentence">바르게 고친 문장</label>
            <textarea
              disabled={completed}
              id="corrected-sentence"
              maxLength={300}
              onChange={(event) => setCorrection(event.target.value)}
              placeholder="정답을 보고 옮기지 말고 문장 전체를 직접 고쳐 써 보세요."
              value={correction}
            />
            <label htmlFor="correction-reason">고친 이유</label>
            <textarea
              disabled={completed}
              id="correction-reason"
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="어떤 문법 요소가 왜 어울리지 않았는지 설명해 보세요."
              value={reason}
            />
            {revisionFeedback && (
              <div className={`error-correction-feedback ${revisionFeedback.kind}`} role="status">
                <strong>{revisionFeedback.kind === "success" ? "문장을 바르게 고치고 이유까지 설명했어요!" : "조금만 더 다듬어 볼까요?"}</strong>
                <p>{revisionFeedback.message}</p>
              </div>
            )}
            {!completed && (
              <button
                aria-busy={pending}
                className="primary-button"
                disabled={pending || !correction.trim() || !reason.trim()}
                onClick={submitRevision}
                type="button"
              >
                {pending ? <MondeukLoading compact /> : "고친 문장과 이유 확인하기"}
              </button>
            )}
          </section>
        )}
        {error && <div className="error-panel" role="alert">{error}</div>}
      </article>
    </section>
  );
}
