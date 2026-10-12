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

const progressionQuestions: Record<TurnRequest["activity"], string[]> = {
  diagnose: [
    "그 판단에 사용한 조사나 어미를 하나 적어 보세요.",
    "찾은 구조가 문장의 뜻을 어떻게 분명하게 하는지 적어 보세요.",
    "같은 기준을 새 문장에 적용해 보세요."
  ],
  create: [
    "처음 문장과 고친 문장에서 달라진 표현 하나를 적어 보세요.",
    "그 변화로 뜻이나 상황 적절성이 어떻게 달라졌는지 적어 보세요.",
    "같은 방법을 다른 상황에 적용한 새 문장을 써 보세요."
  ],
  expand: [
    "덧붙인 부분이 어떤 말을 꾸미는지 적어 보세요.",
    "확장 전후에 새로 생긴 정보를 하나 적어 보세요.",
    "같은 방법으로 다른 문장을 확장해 보세요."
  ],
  compare: [
    "두 표현에서 달라진 정보 하나를 적어 보세요.",
    "그 차이가 뜻이나 강조점에 미친 효과를 적어 보세요.",
    "같은 기준으로 다른 두 문장을 비교해 보세요."
  ],
  error: [
    "고친 부분이 어떤 문법 관계를 바로잡았는지 적어 보세요.",
    "고치기 전후의 뜻 차이를 하나 적어 보세요.",
    "같은 오류가 있는 새 문장을 직접 고쳐 보세요."
  ],
  transfer: [
    "새 상황에 적용한 문법 단서를 하나 표시해 보세요.",
    "그 표현이 새 상황에 알맞은 까닭을 적어 보세요.",
    "다른 독자나 목적으로 바꾸어 한 문장을 다시 써 보세요."
  ],
  reflect: [
    "처음 답과 달라진 점 하나를 적어 보세요.",
    "도움 없이 해결한 부분을 하나 골라 보세요.",
    "다음에도 사용할 방법을 한 가지 적어 보세요."
  ],
  authentic: [
    "자료에서 판단의 근거가 된 표현 하나를 적어 보세요.",
    "그 표현이 독자에게 주는 효과를 하나 설명해 보세요.",
    "자료의 목적에 더 맞도록 한 부분을 직접 고쳐 보세요."
  ]
};

const repeatedQuestionStopWords = new Set([
  "문장", "현재", "이번", "질문", "답", "내용", "부분", "하나", "한가지",
  "적어", "써", "보세요", "말해", "설명해", "찾아", "골라", "무엇", "어떤",
  "왜", "어떻게", "인가요", "할까요", "주세요"
]);

function questionTerms(question: string) {
  return question
    .replace(/[^가-힣a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((term) => term.replace(/(?:으로|에서|에게|부터|까지|처럼|보다|하고|이며|이고|은|는|이|가|을|를|와|과|의|도|만)$/g, ""))
    .filter((term) => term.length >= 2 && !repeatedQuestionStopWords.has(term));
}

function isRepeatedQuestion(currentQuestion: string, nextQuestion: string) {
  if (!currentQuestion.trim() || !nextQuestion.trim()) return false;
  const current = questionTerms(currentQuestion);
  const next = questionTerms(nextQuestion);
  if (current.length === 0 || next.length === 0) {
    return currentQuestion.replace(/\s|[?!.]/g, "") === nextQuestion.replace(/\s|[?!.]/g, "");
  }
  const nextSet = new Set(next);
  const overlap = current.filter((term) => nextSet.has(term)).length;
  return overlap / Math.min(current.length, next.length) >= 0.6;
}

function nextLearningQuestion(request: TurnRequest, proposedQuestion: string) {
  if (proposedQuestion.trim() && !isRepeatedQuestion(request.currentQuestion, proposedQuestion)) {
    return proposedQuestion;
  }

  const questions = progressionQuestions[request.activity];
  const startIndex = Math.min(request.attemptCount, questions.length - 1);
  for (let offset = 0; offset < questions.length; offset += 1) {
    const candidate = questions[(startIndex + offset) % questions.length];
    if (!isRepeatedQuestion(request.currentQuestion, candidate)) return candidate;
  }
  return questions[startIndex];
}

function needsSimplifying(question: string) {
  const questionMarks = (question.match(/\?/g) ?? []).length;
  return question.trim().length === 0
    || question.length > MAX_QUESTION_LENGTH
    || questionMarks > 1
    || /각각.*주어.*서술어|주어.*(?:목적어|부사어).*서술어|[‘'][^’']+[’'](?:을|를)?\s*주어.*[‘'][^’']+[’'](?:을|를)?\s*서술어|누가 무엇을 하는가|판단.*뒷받침|한 문장으로 설명/.test(question);
}

function requiredSequenceComplete(request: TurnRequest) {
  const progress = /\[현재까지 답을 확인한 문장\]\s*(\d+)\s*\/\s*(\d+)/.exec(request.message);
  if (!progress) return true;
  const completedBeforeCurrent = Number(progress[1]);
  const total = Number(progress[2]);
  return total > 0 && completedBeforeCurrent + 1 >= total;
}

export function applyTutorResponsePolicy(request: TurnRequest, response: AgentResponse): AgentResponse {
  const completionEnabled = request.message.includes("[활동 완료 기준]");
  const activityComplete = completionEnabled && request.supportMode === "submit" && requiredSequenceComplete(request) && (
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
    && (response.answerStatus === "incorrect" || response.answerStatus === "not_answered");
  if (shouldRevealAfterHints || shouldRevealAfterAnswers) {
    const resolvedQuestionAnswer = response.resolvedQuestionAnswer.trim() || response.studentMessage.trim();
    const nextQuestion = nextLearningQuestion(request, response.question);
    return {
      ...response,
      mode: "model",
      studentMessage: "이 질문은 정답을 확인하고 다음 질문으로 넘어갈게요.",
      questionResolution: "reveal_and_advance",
      resolvedQuestionAnswer,
      question: needsSimplifying(nextQuestion)
        ? conciseQuestions[request.activity][Math.min(request.attemptCount, 2)]
        : nextQuestion,
      activityComplete: false,
      masteryEvidence: []
    };
  }

  const answeredCurrentQuestion = request.supportMode === "submit"
    && (response.answerStatus === "partial" || response.answerStatus === "met");
  const mustContinueCurrentQuestion = request.supportMode === "hint"
    || response.answerStatus === "incorrect"
    || response.answerStatus === "not_answered";
  const questionResolution = answeredCurrentQuestion
    ? "advance"
    : mustContinueCurrentQuestion
    ? "continue"
    : response.questionResolution === "complete"
    ? "advance"
    : response.questionResolution;
  const forcedAdvance = answeredCurrentQuestion && response.questionResolution !== "advance";
  const proposedQuestion = questionResolution === "continue" && request.currentQuestion.trim()
    ? request.currentQuestion
    : questionResolution === "advance"
    ? nextLearningQuestion(request, forcedAdvance ? "" : response.question)
    : response.question;
  const question = questionResolution === "continue" && request.currentQuestion.trim()
    ? request.currentQuestion
    : needsSimplifying(proposedQuestion)
    ? nextLearningQuestion(request, conciseQuestions[request.activity][Math.min(request.attemptCount, 2)])
    : proposedQuestion;
  const advancedAfterPartialAnswer = forcedAdvance;

  return {
    ...response,
    answerStatus: response.answerStatus === "met" ? "partial" : response.answerStatus,
    questionResolution,
    resolvedQuestionAnswer: "",
    studentMessage: advancedAfterPartialAnswer
      ? "답에서 핵심 내용을 확인했어요. 다음 학습 질문으로 넘어갈게요."
      : response.studentMessage.slice(0, 220),
    question,
    activityComplete: false,
    masteryEvidence: completionEnabled ? [] : response.masteryEvidence
  };
}
