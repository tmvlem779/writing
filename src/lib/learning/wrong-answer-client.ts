export type WrongAnswerSource = "diagnosis" | "challenge" | "self-study";

type WrongAnswerInput = {
  source: WrongAnswerSource;
  sourceLabel: string;
  problemId: string;
  problemTitle: string;
  question: string;
  submittedAnswer: string;
  feedbackHint: string;
};

async function postWrongAnswer(body: Record<string, unknown>) {
  try {
    await fetch("/api/wrong-answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    // 오답 기록 실패가 현재 학습 흐름을 막지 않도록 한다.
  }
}

export function recordWrongAnswer(input: WrongAnswerInput) {
  return postWrongAnswer({ action: "record", ...input });
}

export function resolveWrongAnswer(source: WrongAnswerSource, problemId: string) {
  return postWrongAnswer({ action: "resolve", source, problemId });
}
