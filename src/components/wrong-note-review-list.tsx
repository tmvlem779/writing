"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import type { PublicWrongNotePracticeQuestion, WrongNoteSource } from "@/lib/learning/wrong-note-practice";

type WrongNoteView = {
  id: string;
  source: WrongNoteSource;
  sourceLabel: string;
  problemTitle: string;
  question: string;
  submittedAnswer: string;
  feedbackHint: string;
  attemptCount: number;
  resolvedAt: string | null;
  updatedAt: string;
  practice: {
    noteId: string;
    questions: [PublicWrongNotePracticeQuestion, PublicWrongNotePracticeQuestion, PublicWrongNotePracticeQuestion];
  } | null;
};

const sourceLinks = {
  diagnosis: "/learn/diagnosis",
  challenge: "/learn/challenge",
  "self-study": "/learn/self-study"
} as const;

type Feedback = { kind: "retry" | "correct" | "complete" | "error"; message: string } | null;

export function WrongNoteReviewList({ notes }: { notes: WrongNoteView[] }) {
  const router = useRouter();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[][]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, setPending] = useState(false);
  const [locallyResolved, setLocallyResolved] = useState<string[]>([]);

  function openReview(noteId: string) {
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
      return;
    }
    setActiveNoteId(noteId);
    setQuestionIndex(0);
    setSelectedOptionIds([]);
    setAcceptedAnswers([]);
    setFeedback(null);
  }

  function chooseOption(question: PublicWrongNotePracticeQuestion, optionId: string) {
    if (pending || feedback?.kind === "correct" || feedback?.kind === "complete") return;
    setSelectedOptionIds((current) => question.multiple
      ? current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      : [optionId]);
    setFeedback(null);
  }

  async function checkAnswer(note: WrongNoteView) {
    if (!note.practice || selectedOptionIds.length === 0 || pending) return;
    const answers = [...acceptedAnswers, selectedOptionIds];
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/wrong-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-review", noteId: note.id, answers })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "오답을 확인하지 못했습니다.");
      if (!body.correct) {
        setFeedback({ kind: "retry", message: body.hint ?? "다시 볼 단서를 확인해 보세요." });
        return;
      }
      setAcceptedAnswers(answers);
      if (body.resolved) {
        setLocallyResolved((current) => [...new Set([...current, note.id])]);
        setFeedback({ kind: "complete", message: "기존 오답과 비슷한 유형 두 문제를 모두 해결했어요. 오답 해결 완료로 기록했습니다." });
        router.refresh();
      } else {
        setFeedback({ kind: "correct", message: body.explanation ?? "알맞게 해결했어요." });
      }
    } catch (caught) {
      setFeedback({ kind: "error", message: caught instanceof Error ? caught.message : "오답을 확인하지 못했습니다." });
    } finally {
      setPending(false);
    }
  }

  function moveToNextQuestion() {
    setQuestionIndex((index) => Math.min(index + 1, 2));
    setSelectedOptionIds([]);
    setFeedback(null);
  }

  return (
    <div className="wrong-note-list">
      {notes.map((note) => {
        const resolved = Boolean(note.resolvedAt) || locallyResolved.includes(note.id);
        const open = activeNoteId === note.id;
        const practiceQuestion = note.practice?.questions[questionIndex];
        return (
          <article className={resolved ? "wrong-note-card resolved" : "wrong-note-card"} key={note.id}>
            <div className="wrong-note-meta">
              <span>{note.sourceLabel}</span>
              <small>{note.problemTitle}</small>
              <i>{resolved ? "다시 해결함" : `${note.attemptCount}회 오답`}</i>
            </div>
            <h2>{note.question}</h2>
            <div className="wrong-note-summary-row">
              <dl>
                <div><dt>내가 고른 답</dt><dd>{note.submittedAnswer}</dd></div>
                <div><dt>다시 볼 단서</dt><dd>{note.feedbackHint}</dd></div>
              </dl>
              {note.practice ? (
                <button
                  aria-expanded={open}
                  className="secondary-button wrong-note-review-button"
                  onClick={() => openReview(note.id)}
                  type="button"
                >
                  {open ? "연습 닫기" : resolved ? "다시 연습하기" : "오답 다시 풀기"}
                </button>
              ) : (
                <Link className="secondary-button wrong-note-review-button" href={sourceLinks[note.source]}>원래 영역에서 풀기</Link>
              )}
            </div>

            {open && practiceQuestion && (
              <section className="wrong-note-review" aria-labelledby={`wrong-note-review-${note.id}`}>
                <header>
                  <div>
                    <span>{practiceQuestion.label}</span>
                    <h3 id={`wrong-note-review-${note.id}`}>{practiceQuestion.prompt}</h3>
                  </div>
                  <strong>{questionIndex + 1} / 3</strong>
                </header>
                <div className="wrong-note-review-progress" aria-label={`세 문제 중 ${questionIndex + 1}번째 문제`}>
                  {[0, 1, 2].map((index) => <i className={index < acceptedAnswers.length ? "done" : index === questionIndex ? "active" : ""} key={index} />)}
                </div>
                {practiceQuestion.multiple && <p className="wrong-note-review-guide">정답이 여러 개일 수 있어요. 해당하는 부분을 모두 고르세요.</p>}
                <div className="wrong-note-review-options">
                  {practiceQuestion.options.map((option, index) => (
                    <button
                      aria-pressed={selectedOptionIds.includes(option.id)}
                      className={selectedOptionIds.includes(option.id) ? "selected" : ""}
                      disabled={pending || feedback?.kind === "correct" || feedback?.kind === "complete"}
                      key={option.id}
                      onClick={() => chooseOption(practiceQuestion, option.id)}
                      type="button"
                    >
                      <i>{String.fromCharCode(65 + index)}</i><span>{option.label}</span>
                    </button>
                  ))}
                </div>
                {feedback && (
                  <div className={`wrong-note-review-feedback ${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>
                    <strong>{feedback.kind === "retry" ? "단서를 보고 다시 생각해 보세요" : feedback.kind === "complete" ? "오답 해결 완료" : feedback.kind === "correct" ? "맞았어요" : "확인하지 못했어요"}</strong>
                    <p>{feedback.message}</p>
                  </div>
                )}
                <footer>
                  <span>{questionIndex === 0 ? "먼저 기존 오답을 해결해요." : "같은 원리를 새 문장에 적용해요."}</span>
                  {feedback?.kind === "correct" ? (
                    <button className="primary-button" onClick={moveToNextQuestion} type="button">다음 문제 풀기</button>
                  ) : feedback?.kind !== "complete" ? (
                    <button className="primary-button" disabled={selectedOptionIds.length === 0 || pending} onClick={() => checkAnswer(note)} type="button">
                      {pending ? <MondeukLoading compact /> : "답 확인하기"}
                    </button>
                  ) : null}
                </footer>
              </section>
            )}

            <footer className="wrong-note-card-footer">
              <time dateTime={note.updatedAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(note.updatedAt))}</time>
              <Link href={sourceLinks[note.source]}>이 영역 다시 학습하기 →</Link>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
