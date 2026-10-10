import type { AgentResponse, TurnRequest } from "./schema";

const MAX_QUESTION_LENGTH = 76;

const conciseQuestions: Record<TurnRequest["activity"], string[]> = {
  diagnose: [
    "답을 찾을 때 살핀 조사나 형태를 하나만 적어 보세요.",
    "가장 확실한 단서 하나를 골라 적어 보세요.",
    "아직 헷갈리는 부분을 한 가지만 적어 보세요."
  ],
  create: [
    "현재 과제에서 빠진 조건 하나만 보태 문장을 다시 써 보세요.",
    "아직 드러나지 않은 조건 하나를 문장에 보태 보세요.",
    "조건을 모두 갖춘 한 문장으로 다시 써 보세요."
  ],
  expand: [
    "원래 문장에 덧붙인 부분만 찾아 적어 보세요.",
    "덧붙인 부분이 꾸미는 말을 하나 골라 보세요.",
    "확장 전후의 뜻 차이를 한 가지 적어 보세요."
  ],
  compare: [
    "두 문장에서 달라진 표현 하나만 찾아 적어 보세요.",
    "두 문장 중 뜻이 더 분명한 쪽을 골라 보세요.",
    "고른 까닭을 단서 하나로 설명해 보세요."
  ],
  error: [
    "어색한 부분 한 곳만 골라 보세요.",
    "그 부분에서 서로 맞지 않는 말 두 개를 찾아 보세요.",
    "고른 부분만 직접 고쳐 써 보세요."
  ],
  transfer: [
    "같은 방법을 쓸 새 상황 하나를 골라 보세요.",
    "고른 상황에 맞는 문장을 한 문장 써 보세요.",
    "사용한 문법 단서를 하나 표시해 보세요."
  ],
  reflect: [
    "처음 답과 달라진 점 하나만 적어 보세요.",
    "스스로 해결한 부분을 하나 골라 보세요.",
    "다음에도 사용할 방법을 한 가지 적어 보세요."
  ],
  authentic: [
    "자료에서 근거가 된 표현 하나만 찾아 적어 보세요.",
    "그 표현이 독자에게 주는 느낌을 하나 골라 보세요.",
    "자료의 목적에 맞게 바꿀 부분 하나를 적어 보세요."
  ]
};

function needsSimplifying(question: string) {
  const questionMarks = (question.match(/\?/g) ?? []).length;
  return question.trim().length === 0
    || question.length > MAX_QUESTION_LENGTH
    || questionMarks > 1
    || /각각.*주어.*서술어|주어.*(?:목적어|부사어).*서술어|[‘'][^’']+[’'](?:을|를)?\s*주어.*[‘'][^’']+[’'](?:을|를)?\s*서술어|누가 무엇을 하는가|판단.*뒷받침|한 문장으로 설명/.test(question);
}

export function applyTutorResponsePolicy(request: TurnRequest, response: AgentResponse): AgentResponse {
  const completionEnabled = request.message.includes("[활동 완료 기준]");
  const activityComplete = completionEnabled && (
    response.answerStatus === "met"
    || response.activityComplete
    || response.masteryEvidence.length > 0
  );
  if (activityComplete) {
    const masteryEvidence = response.masteryEvidence.length > 0
      ? response.masteryEvidence
      : [response.observations[0] ?? "처음 답과 후속 설명을 합친 누적 답변이 활동 완료 기준을 충족함"];
    return {
      ...response,
      answerStatus: "met",
      questionResolution: "complete",
      resolvedQuestionAnswer: "",
      studentMessage: response.studentMessage.slice(0, 180),
      question: "",
      nextAction: "complete",
      activityComplete: true,
      masteryEvidence
    };
  }

  const shouldRevealAfterHints = request.supportMode === "hint" && request.questionHintCount >= 2;
  const shouldRevealAfterAnswers = request.supportMode === "submit"
    && request.questionAttemptCount >= 2
    && (response.answerStatus === "incorrect" || response.answerStatus === "partial")
    && response.questionResolution !== "advance";
  if (shouldRevealAfterHints || shouldRevealAfterAnswers) {
    const resolvedQuestionAnswer = response.resolvedQuestionAnswer.trim() || response.studentMessage.trim();
    return {
      ...response,
      mode: "model",
      studentMessage: "이 질문은 정답을 확인하고 다음 질문으로 넘어갈게요.",
      questionResolution: "reveal_and_advance",
      resolvedQuestionAnswer,
      activityComplete: false,
      masteryEvidence: []
    };
  }

  const question = needsSimplifying(response.question)
    ? conciseQuestions[request.activity][Math.min(request.attemptCount, 2)]
    : response.question;

  return {
    ...response,
    answerStatus: response.answerStatus === "met" ? "partial" : response.answerStatus,
    questionResolution: response.questionResolution === "complete" ? "advance" : response.questionResolution,
    resolvedQuestionAnswer: "",
    studentMessage: response.studentMessage.slice(0, 220),
    question,
    activityComplete: false,
    masteryEvidence: completionEnabled ? [] : response.masteryEvidence
  };
}
