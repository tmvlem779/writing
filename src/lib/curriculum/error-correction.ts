export type ErrorCorrectionItemId =
  | "place-particle"
  | "past-tense"
  | "subject-honorific"
  | "double-passive"
  | "honorific-subject"
  | "quotation-ending";

export type ErrorCorrectionItem = {
  id: ErrorCorrectionItemId;
  title: string;
  focus: string;
  context: string;
  tokens: string[];
  incorrectTokenIndexes: number[];
  acceptedCorrections: string[];
  reasonKeywords: string[];
  selectionHint: string;
  correctionHint: string;
  reasonHint: string;
  explanation: string;
};

export const errorCorrectionItems: ErrorCorrectionItem[] = [
  {
    id: "place-particle",
    title: "장소에 맞는 조사 고치기",
    focus: "문장 성분과 조사",
    context: "공을 찬 장소가 운동장이라는 뜻이 분명하게 드러나도록 고쳐 보세요.",
    tokens: ["학생이", "운동장을", "공을", "찼다."],
    incorrectTokenIndexes: [1],
    acceptedCorrections: ["학생이 운동장에서 공을 찼다."],
    reasonKeywords: ["에서", "장소", "부사어", "조사"],
    selectionHint: "‘공을 찬 곳’을 나타내야 하는 말에 어떤 조사가 붙었는지 살펴보세요.",
    correctionHint: "장소에서 행동이 일어났음을 나타내는 조사를 떠올려 보세요.",
    reasonHint: "바꾼 조사가 장소와 행동의 관계를 어떻게 나타내는지 설명해 보세요.",
    explanation: "행동이 일어난 장소에는 조사 ‘에서’를 써서 ‘운동장에서’라고 표현합니다."
  },
  {
    id: "past-tense",
    title: "시간에 맞는 시제 고치기",
    focus: "시간 표현과 시제",
    context: "‘어제’ 일어난 일을 말하는 문장입니다. 시간 표현과 서술어가 어울리는지 살펴보세요.",
    tokens: ["나는", "어제", "도서관에", "갈 것이다."],
    incorrectTokenIndexes: [3],
    acceptedCorrections: ["나는 어제 도서관에 갔다."],
    reasonKeywords: ["어제", "과거", "시제", "시간"],
    selectionHint: "시간을 나타내는 ‘어제’와 문장 끝의 시간이 서로 맞는지 살펴보세요.",
    correctionHint: "이미 끝난 일을 나타내는 과거 시제로 바꾸어 보세요.",
    reasonHint: "‘어제’와 어떤 시제가 어울리는지 밝혀 보세요.",
    explanation: "‘어제’는 이미 지난 시간을 가리키므로 서술어도 과거 시제인 ‘갔다’로 써야 합니다."
  },
  {
    id: "subject-honorific",
    title: "주체에 맞는 높임 표현 고치기",
    focus: "주체 높임",
    context: "말하는 사람이 할머니의 행동을 높여 말하는 상황입니다.",
    tokens: ["할머니께서", "진지를", "먹었다."],
    incorrectTokenIndexes: [2],
    acceptedCorrections: ["할머니께서 진지를 드셨다."],
    reasonKeywords: ["높임", "주체", "할머니", "드시"],
    selectionHint: "높여야 할 사람이 누구인지, 그 사람의 행동을 나타내는 말이 무엇인지 찾아보세요.",
    correctionHint: "‘먹다’를 높여 말하는 어휘와 높임 선어말 어미를 함께 떠올려 보세요.",
    reasonHint: "행동의 주체를 왜 높여야 하는지 설명해 보세요.",
    explanation: "주체인 할머니를 높여야 하므로 ‘먹었다’ 대신 높임 표현인 ‘드셨다’를 씁니다."
  },
  {
    id: "double-passive",
    title: "겹친 피동 표현 고치기",
    focus: "피동 표현",
    context: "바람 때문에 문이 열린 상황을 자연스럽게 나타내는 문장으로 고쳐 보세요.",
    tokens: ["문이", "바람에", "열려졌다."],
    incorrectTokenIndexes: [2],
    acceptedCorrections: ["문이 바람에 열렸다."],
    reasonKeywords: ["피동", "이중", "겹", "열리"],
    selectionHint: "문이 스스로 행동한 것이 아니라 열린 상태가 되었음을 나타내는 말에 주목하세요.",
    correctionHint: "피동의 뜻을 한 번만 나타내도록 간결하게 고쳐 보세요.",
    reasonHint: "피동 표현이 어떻게 겹쳐 있는지 설명해 보세요.",
    explanation: "‘열리다’에 이미 피동의 뜻이 있으므로 ‘-어지다’를 다시 붙이지 않고 ‘열렸다’라고 씁니다."
  },
  {
    id: "honorific-subject",
    title: "행동 주체에 맞게 높임 고치기",
    focus: "주체 높임과 겸양",
    context: "선생님이 학생에게 부탁한 일을 학생이 전하는 상황입니다.",
    tokens: ["선생님이", "학생에게", "조용히", "하라고", "부탁드렸다."],
    incorrectTokenIndexes: [4],
    acceptedCorrections: ["선생님이 학생에게 조용히 하라고 부탁하셨다."],
    reasonKeywords: ["높임", "주체", "선생님", "하셨"],
    selectionHint: "부탁한 사람이 선생님일 때, 그 행동을 낮추는 말이 알맞은지 살펴보세요.",
    correctionHint: "행동의 주체인 선생님을 높이는 서술어로 바꾸어 보세요.",
    reasonHint: "누구의 행동을 높이는 표현인지 밝혀 보세요.",
    explanation: "부탁한 주체가 선생님이므로 겸양 표현 ‘부탁드렸다’가 아니라 주체 높임 표현 ‘부탁하셨다’를 씁니다."
  },
  {
    id: "quotation-ending",
    title: "인용 표현 고치기",
    focus: "간접 인용",
    context: "민지가 한 말을 다른 사람이 간접적으로 전하는 문장입니다.",
    tokens: ["민지는", "내일", "발표할", "거야라고", "말했다."],
    incorrectTokenIndexes: [3],
    acceptedCorrections: ["민지는 내일 발표할 거라고 말했다."],
    reasonKeywords: ["인용", "라고", "간접", "거라고"],
    selectionHint: "다른 사람의 말을 전할 때 인용을 나타내는 조사가 어디에 붙는지 살펴보세요.",
    correctionHint: "‘것이라고’가 줄어든 간접 인용 표현을 떠올려 보세요.",
    reasonHint: "다른 사람의 말을 간접적으로 옮길 때 어떤 표현을 쓰는지 설명해 보세요.",
    explanation: "간접 인용에서는 ‘것이라고’가 준 ‘거라고’를 써서 ‘발표할 거라고 말했다’라고 표현합니다."
  }
];

export function getErrorCorrectionItem(id: string) {
  return errorCorrectionItems.find((item) => item.id === id) ?? errorCorrectionItems[0];
}
