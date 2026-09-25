import type { AgentResponse, TurnRequest } from "./schema.ts";
import { nextScaffoldLevel, scaffoldLabel } from "./state-machine.ts";

const activityQuestions = {
  diagnose: "이 문장에서 주어와 서술어를 찾아 서로 어떻게 호응하는지 설명해 볼까요?",
  create: "주어와 서술어가 분명한 기본 문장을 먼저 한 문장 만들어 볼까요?",
  expand: "원래 뜻을 유지하면서 수식어나 절 하나를 더해 문장을 확장해 볼까요?",
  compare: "두 문장에서 더 강조되는 정보가 무엇인지 각각 설명해 볼까요?",
  error: "어색하다고 느끼는 부분을 먼저 표시하고, 왜 그런지 말해 볼까요?",
  transfer: "같은 문장 구조를 새로운 주제나 상황에 적용해 한 문장 써 볼까요?",
  reflect: "처음 문장과 지금 문장을 비교해 구조와 표현이 달라진 점을 말해 볼까요?",
  authentic: "자료에서 찾은 문장 구조가 글의 목적과 독자에게 어떤 효과를 주는지 근거와 함께 설명해 볼까요?"
} as const;

const nextActions = {
  diagnose: "explain",
  create: "rewrite",
  expand: "expand",
  compare: "compare",
  error: "rewrite",
  transfer: "transfer",
  reflect: "explain",
  authentic: "transfer"
} as const;

export function buildFallbackResponse(request: TurnRequest): AgentResponse {
  const asksForHelp = /(모르|도와|힌트|어려)/.test(request.message);
  const level = nextScaffoldLevel({
    currentLevel: request.scaffoldLevel,
    attemptCount: request.attemptCount,
    askedForHelp: asksForHelp
  });

  const lead = [
    "좋아요. 먼저 문장 안에서 눈에 보이는 단서를 찾아봅시다.",
    "핵심이 되는 성분이나 연결 표현 한 곳에 집중해 봅시다.",
    "두 가능성을 비교해 보면 판단하기 쉬워집니다.",
    "문장의 일부 구조를 잡아 드릴게요. 나머지는 직접 완성해 보세요.",
    "직접 설명을 확인한 뒤, 같은 원리를 새 문장에 적용해 봅시다."
  ][level];

  return {
    mode: request.activity === "error" ? "revise" : request.activity === "compare" ? "compare" : level === 4 ? "model" : level > 0 ? "hint" : "question",
    scaffoldLevel: level,
    studentMessage: `${lead} 현재 도움 단계는 ‘${scaffoldLabel(level)}’입니다.`,
    question: activityQuestions[request.activity],
    focusConcepts: request.activity === "authentic"
      ? ["문장 구조", "표현 효과", "목적과 독자"]
      : ["문장 성분", "호응과 확장"],
    observations: ["개발용 규칙 기반 응답이며 실제 수업에서는 AI 진단 결과로 대체됩니다."],
    nextAction: nextActions[request.activity],
    masteryEvidence: [],
    safety: { blocked: false, reason: null }
  };
}
