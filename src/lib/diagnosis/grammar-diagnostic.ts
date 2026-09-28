export type DiagnosticDomain = "문장 기초" | "문장 확대" | "문법 요소" | "맥락과 의미";

export type DiagnosticQuestion = {
  id: string;
  order: number;
  domain: DiagnosticDomain;
  level: "기초" | "적용" | "의미";
  prompt: string;
  options: Array<{ id: string; label: string }>;
  answer: string;
  retryHint: string;
  explanation: string;
};

export const grammarDiagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: "subject-predicate",
    order: 1,
    domain: "문장 기초",
    level: "기초",
    prompt: "‘학생들이 운동장에서 공을 찬다.’의 주어와 서술어를 바르게 짝지은 것은 무엇인가요?",
    options: [
      { id: "a", label: "학생들이 — 찬다" },
      { id: "b", label: "운동장에서 — 공을" },
      { id: "c", label: "학생들이 — 공을" },
      { id: "d", label: "공을 — 운동장에서" }
    ],
    answer: "a",
    retryHint: "누가 무엇을 하는지 묻고, 동작의 주체와 그 주체의 움직임을 찾아보세요.",
    explanation: "‘학생들이’가 동작의 주체이고 ‘찬다’가 그 동작을 나타냅니다."
  },
  {
    id: "clause-count",
    order: 2,
    domain: "문장 기초",
    level: "기초",
    prompt: "‘비가 그치자 학생들이 운동장으로 나갔다.’를 겹문장으로 판단하는 가장 알맞은 근거는 무엇인가요?",
    options: [
      { id: "a", label: "단어가 여섯 개 이상이기 때문이다." },
      { id: "b", label: "주어·서술어 관계가 두 번 나타나기 때문이다." },
      { id: "c", label: "조사가 두 개 쓰였기 때문이다." },
      { id: "d", label: "문장이 길기 때문이다." }
    ],
    answer: "b",
    retryHint: "문장 길이보다 ‘비가-그치다’, ‘학생들이-나갔다’처럼 관계의 수를 세어 보세요.",
    explanation: "두 개의 주어·서술어 관계가 있으므로 두 절이 결합한 겹문장입니다."
  },
  {
    id: "connected-meaning",
    order: 3,
    domain: "문장 확대",
    level: "적용",
    prompt: "‘길이 얼어서 버스가 늦었다.’에서 앞절과 뒤 절의 의미 관계는 무엇인가요?",
    options: [
      { id: "a", label: "나열" },
      { id: "b", label: "대조" },
      { id: "c", label: "원인과 결과" },
      { id: "d", label: "선택" }
    ],
    answer: "c",
    retryHint: "‘길이 언 일’이 ‘버스가 늦은 일’보다 먼저 일어난 까닭인지 살펴보세요.",
    explanation: "‘-어서’가 앞절의 원인과 뒤 절의 결과를 연결합니다."
  },
  {
    id: "embedded-role",
    order: 4,
    domain: "문장 확대",
    level: "적용",
    prompt: "‘친구가 추천한 책을 읽었다.’에서 ‘친구가 추천한’의 역할은 무엇인가요?",
    options: [
      { id: "a", label: "‘책’을 꾸며 주는 관형절" },
      { id: "b", label: "‘읽었다’를 꾸며 주는 부사절" },
      { id: "c", label: "문장의 주어가 되는 명사절" },
      { id: "d", label: "다른 말을 그대로 옮긴 인용절" }
    ],
    answer: "a",
    retryHint: "안긴절 바로 뒤의 명사 ‘책’에 어떤 정보를 더하는지 살펴보세요.",
    explanation: "‘친구가 추천한’은 뒤의 명사 ‘책’을 꾸미므로 관형절입니다."
  },
  {
    id: "honorific-time",
    order: 5,
    domain: "문법 요소",
    level: "적용",
    prompt: "‘선생님께서 교실에 계셨다.’에 사용된 표현을 바르게 설명한 것은 무엇인가요?",
    options: [
      { id: "a", label: "객체 높임과 미래 시제" },
      { id: "b", label: "주체 높임과 과거 시제" },
      { id: "c", label: "상대 높임과 현재 진행" },
      { id: "d", label: "주체 낮춤과 완료상" }
    ],
    answer: "b",
    retryHint: "‘께서·계시다’가 누구를 높이는지, ‘-었-’이 어느 시간을 나타내는지 나누어 보세요.",
    explanation: "‘께서·계시다’는 주체를 높이고 ‘-었-’은 과거를 나타냅니다."
  },
  {
    id: "voice-causative",
    order: 6,
    domain: "문법 요소",
    level: "적용",
    prompt: "‘교사가 학생에게 책을 읽게 했다.’에 대한 설명으로 알맞은 것은 무엇인가요?",
    options: [
      { id: "a", label: "학생이 다른 사람에게 읽는 일을 시킨다." },
      { id: "b", label: "교사가 학생에게 읽는 행동을 하도록 한다." },
      { id: "c", label: "책이 학생에 의해 읽힌다." },
      { id: "d", label: "학생이 책을 읽지 못한다." }
    ],
    answer: "b",
    retryHint: "실제로 책을 읽는 사람과 그 행동을 하도록 만드는 사람을 구분해 보세요.",
    explanation: "교사는 사동주이고 학생은 실제로 읽는 행동을 하는 주체입니다."
  },
  {
    id: "negation-meaning",
    order: 7,
    domain: "맥락과 의미",
    level: "의미",
    prompt: "발표할 능력은 있었지만 갑작스러운 정전 때문에 발표할 수 없었던 상황에 가장 알맞은 문장은 무엇인가요?",
    options: [
      { id: "a", label: "나는 발표하지 않았다." },
      { id: "b", label: "나는 발표하지 못했다." },
      { id: "c", label: "나는 발표하지 말았다." },
      { id: "d", label: "나는 발표하지 않는다." }
    ],
    answer: "b",
    retryHint: "의지로 하지 않은 것인지, 외부 상황 때문에 할 수 없었던 것인지 구분해 보세요.",
    explanation: "상황 때문에 실행할 수 없었으므로 능력·상황 부정인 ‘못’ 부정이 알맞습니다."
  },
  {
    id: "quotation-context",
    order: 8,
    domain: "맥락과 의미",
    level: "의미",
    prompt: "민지가 어제 ‘나는 내일 발표할 거야.’라고 말했습니다. 오늘 그 말을 간접 인용한 문장으로 가장 알맞은 것은 무엇인가요?",
    options: [
      { id: "a", label: "민지는 ‘나는 내일 발표할 거야.’라고 말했다." },
      { id: "b", label: "민지는 자신이 오늘 발표할 것이라고 말했다." },
      { id: "c", label: "민지는 내가 내일 발표한다고 말했다." },
      { id: "d", label: "민지는 자신이 어제 발표했다고 말했다." }
    ],
    answer: "b",
    retryHint: "말한 사람의 ‘나’와 말한 시점의 ‘내일’이 오늘 옮겨 말할 때 어떻게 바뀌는지 살펴보세요.",
    explanation: "화자가 민지이므로 ‘나’는 ‘자신’으로, 어제의 ‘내일’은 오늘로 바뀝니다."
  }
];

export function getDiagnosticQuestion(id: string) {
  return grammarDiagnosticQuestions.find((question) => question.id === id);
}

export function scoreDiagnosticAnswers(answers: Record<string, string>) {
  return grammarDiagnosticQuestions.reduce((score, question) => score + (answers[question.id] === question.answer ? 1 : 0), 0);
}
