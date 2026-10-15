import type { AgentResponse, TurnRequest } from "./schema";

type ObjectiveRule = {
  all?: string[][];
  any?: string[];
};

const rules: Record<string, ObjectiveRule> = {
  "article:structure:0": { any: ["지난달"] },
  "article:structure:1": { any: ["수 있을 것으로 내다봤다", "내다봤다"] },
  "article:structure:2": { any: ["드러나지 않는다", "알 수 없다", "주체가 없다"] },
  "article:rewrite:0": { any: ["안전 시설이 이번 주에 보강했다고"] },
  "article:rewrite:1": { any: ["안전 시설을 이번 주에 보강했다고", "이번 주에 안전 시설을 보강했다고"] },

  "notice:structure:0": { any: ["축제 리허설이 진행되는 동안에는", "출입증이 없으면"] },
  "notice:structure:1": { any: ["강당 출입이 제한됩니다", "들어갈 수 없으니"] },
  "notice:structure:2": { all: [["조건", "동안", "없으면"], ["제한", "입장", "들어갈"]] },
  "notice:rewrite:0": { any: ["담당 선생님이 출입증을 보여 드리고"] },
  "notice:rewrite:1": { any: ["담당 선생님께 출입증을 보여 드리고"] },

  "dialogue:structure:0": { any: ["어제는 파일이 열리지 않았지만", "파일이 열리지 않았"] },
  "dialogue:structure:1": { any: ["지금은 잘 열리고 있어", "잘 열리고 있어"] },
  "dialogue:structure:2": { all: [["어제는 파일이 열리지 않았", "과거에는 파일이 열리지 않았"], ["지금은 잘 열리고", "현재는 잘 열리고"]] },
  "dialogue:effect:0": { any: ["하린", "준호", "모둠 친구", "영상 만드는 친구"] },
  "dialogue:effect:1": { any: ["자막을 아직 다 넣지 못했어", "내가 배경 음악을 고를게", "편집이 끝나면", "지금은 잘 열리고 있어"] },
  "dialogue:effect:2": { any: ["자막", "배경 음악", "편집", "확인", "파일", "열리"] },
  "dialogue:rewrite:0": { any: ["나에게 네가 확인하게 해 줘"] },
  "dialogue:rewrite:1": { any: ["내가 파일을 확인할 수 있게 해 줘", "내가 확인하게 해 줘", "네가 파일을 확인해 줘"] },
  "dialogue:rewrite:2": { all: [["누가", "주체", "확인하는 사람", "내가", "준호"], ["무엇", "대상", "파일"]] },

  "presentation:structure:0": { any: ["버려진 종이컵", "운영해 보려고 합니다"] },
  "presentation:structure:1": { any: ["개인 컵을 사용하면"] },
  "presentation:structure:2": { any: ["쓰레기를 줄일", "습관도 기를", "사용 주간"] },
  "presentation:rewrite:0": { any: ["개인 컵 사용 주간이 운영해 보려고 합니다"] },
  "presentation:rewrite:1": { any: ["개인 컵 사용 주간을 운영해 보려고 합니다", "우리 반은 개인 컵 사용 주간을 운영하려고 합니다"] },

  "interview:structure:0": { any: ["선생님께서는", "계십니까", "살피신다고"] },
  "interview:structure:1": { any: ["확인하고 있습니다", "말씀드렸습니다"] },
  "interview:structure:2": { any: ["높임", "간접 인용", "직접 인용"] },
  "interview:rewrite:0": { any: ["살피신다고 말씀드렸습니다"] },
  "interview:rewrite:1": { any: ["살피신다고 말씀하셨습니다"] },

  "social:structure:0": { any: ["오늘", "열렸어요"] },
  "social:structure:1": { any: ["전달할 예정", "참여할 거예요"] },
  "social:structure:2": { all: [["지난", "과거", "열렸"], ["앞으로", "미래", "예정", "거예요"]] },
  "social:rewrite:0": { any: ["전달할 예정되었어요"] },
  "social:rewrite:1": { any: ["전달할 예정이에요", "전달될 예정이에요"] }
};

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[\s'‘’"“”.,!?·:;()]/g, "");
}

function studentAnswer(message: string) {
  const marker = "[학생 답]";
  const index = message.lastIndexOf(marker);
  return index >= 0 ? message.slice(index + marker.length).trim() : "";
}

function includesAny(answer: string, values: string[]) {
  return values.some((value) => answer.includes(normalize(value)));
}

export function hasObjectiveAnswerEvidence(key: string, answer: string) {
  const rule = rules[key];
  if (!rule) return false;
  const normalized = normalize(answer);
  if (normalized.length < 2) return false;
  if (rule.any && !includesAny(normalized, rule.any)) return false;
  if (rule.all && !rule.all.every((group) => includesAny(normalized, group))) return false;
  return true;
}

export function applyObjectiveAnswerEvidence(request: TurnRequest, response: AgentResponse): AgentResponse {
  if (request.supportMode !== "submit" || !request.objectiveQuestionKey) return response;
  if (!hasObjectiveAnswerEvidence(request.objectiveQuestionKey, studentAnswer(request.message))) return response;
  return {
    ...response,
    answerStatus: "met",
    questionResolution: "advance",
    resolvedQuestionAnswer: "",
    studentMessage: "자료의 근거를 정확히 찾아 답했어요.",
    observations: ["현재 핵심 질문의 객관적 근거를 확인함"]
  };
}
