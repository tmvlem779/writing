import type { AgentResponse, TurnRequest } from "./schema";

const MAX_QUESTION_LENGTH = 76;

const conciseQuestions: Record<TurnRequest["activity"], string[]> = {
  diagnose: [
    "답을 찾을 때 살핀 조사나 형태를 하나만 적어 보세요.",
    "가장 확실한 단서 하나를 골라 적어 보세요.",
    "아직 헷갈리는 부분을 한 가지만 적어 보세요."
  ],
  create: [
    "쓴 문장에서 주어와 서술어에 밑줄을 그어 보세요.",
    "조건에 맞게 바꿀 말 하나만 골라 보세요.",
    "바꾼 부분이 뜻에 준 차이를 한 가지 적어 보세요."
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
    || /각각.*주어.*서술어|[‘'][^’']+[’'](?:을|를)?\s*주어.*[‘'][^’']+[’'](?:을|를)?\s*서술어|누가 무엇을 하는가|판단.*뒷받침|한 문장으로 설명/.test(question);
}

export function applyTutorResponsePolicy(request: TurnRequest, response: AgentResponse): AgentResponse {
  const completionEnabled = request.message.includes("[활동 완료 기준]");
  const activityComplete = completionEnabled && (response.activityComplete || response.masteryEvidence.length > 0);
  if (activityComplete) {
    return {
      ...response,
      studentMessage: response.studentMessage.slice(0, 180),
      question: "",
      nextAction: "complete",
      activityComplete: true
    };
  }

  const question = needsSimplifying(response.question)
    ? conciseQuestions[request.activity][Math.min(request.attemptCount, 2)]
    : response.question;

  return {
    ...response,
    studentMessage: response.studentMessage.slice(0, 220),
    question,
    activityComplete: false,
    masteryEvidence: completionEnabled ? [] : response.masteryEvidence
  };
}
