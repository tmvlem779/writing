export type GrammarSummaryBlank = {
  id: string;
  topic: string;
  before: string;
  after: string;
  answers: string[];
  hint: string;
};

export type GrammarSummarySection = {
  id: "sentence-structure" | "grammar-elements";
  eyebrow: string;
  title: string;
  description: string;
  blanks: GrammarSummaryBlank[];
};

export const grammarSummarySections: GrammarSummarySection[] = [
  {
    id: "sentence-structure",
    eyebrow: "탐구 1",
    title: "문장의 구조",
    description: "이어진문장과 안은문장의 관계·기능·표지를 떠올리며 빈칸을 채워 보세요.",
    blanks: [
      { id: "connected-marker", topic: "이어진문장", before: "둘 이상의 절이 ", after: "에 의해 결합된 문장이다.", answers: ["연결 어미", "연결어미"], hint: "절과 절 사이에서 의미 관계를 나타내는 어미를 떠올려 보세요." },
      { id: "coordinate-relation", topic: "대등 연결", before: "앞절과 뒤 절의 의미 관계가 서로 ", after: "하며 나열·대조·선택 관계를 이룬다.", answers: ["대등", "대등하다", "대등함"], hint: "두 절이 어느 한쪽에 기대지 않는 관계예요." },
      { id: "subordinate-relation", topic: "종속 연결", before: "앞절이 뒤 절에 의미상 기대는 ", after: " 관계이며 원인·조건·의도 등을 나타낸다.", answers: ["종속", "종속적", "종속적인"], hint: "앞절과 뒤 절이 독립적이지 않은 관계예요." },
      { id: "embedded-definition", topic: "안은문장", before: "다른 문장을 ", after: "의 형식으로 안고 있는 문장이다.", answers: ["절"], hint: "주어와 서술어의 관계를 갖춘 단위를 쓰세요." },
      { id: "noun-clause", topic: "안긴절의 종류", before: "문장에서 주어·목적어·부사어 등의 기능을 하는 절은 ", after: "이다.", answers: ["명사절"], hint: "명사처럼 쓰이는 절이에요." },
      { id: "adnominal-clause", topic: "안긴절의 종류", before: "문장에서 관형어의 기능을 하는 절은 ", after: "이다.", answers: ["관형절", "관형사절"], hint: "뒤에 오는 체언을 꾸며 주는 절이에요." },
      { id: "adverbial-clause", topic: "안긴절의 종류", before: "문장에서 부사어의 기능을 하는 절은 ", after: "이다.", answers: ["부사절"], hint: "서술어를 꾸며 주는 절이에요." },
      { id: "predicative-clause", topic: "안긴절의 종류", before: "별도의 절 표지 없이 문장에서 서술어 기능을 하는 절은 ", after: "이다.", answers: ["서술절"], hint: "바깥 주어를 서술하는 절이에요." },
      { id: "quotation-clause", topic: "안긴절의 종류", before: "다른 사람의 말이나 글을 ‘라고’ 또는 ‘고’로 안은 절은 ", after: "이다.", answers: ["인용절"], hint: "다른 사람의 말을 가져오는 절이에요." }
    ]
  },
  {
    id: "grammar-elements",
    eyebrow: "탐구 2",
    title: "문법 요소",
    description: "각 문법 요소를 실현하는 대표 표현과 의미를 연결해 보세요.",
    blanks: [
      { id: "sentence-ending", topic: "종결 표현", before: "국어 문장은 ", after: "에 따라 평서문·의문문·명령문·청유문·감탄문으로 나눌 수 있다.", answers: ["종결 어미", "종결어미"], hint: "문장의 끝에서 기능을 나타내는 어미예요." },
      { id: "subject-honorific", topic: "높임 표현", before: "주체 높임은 선어말 어미 ", after: ", 조사 ‘께서’, 특수 어휘 등으로 실현한다.", answers: ["-(으)시-", "(으)시", "으시", "시"], hint: "‘선생님께서 오신다’에서 높임을 나타내는 부분을 찾아보세요." },
      { id: "object-honorific", topic: "높임 표현", before: "객체 높임은 조사 ", after: "와 ‘모시다·드리다·여쭈다·뵈다’ 같은 어휘로 실현한다.", answers: ["께"], hint: "‘선생님께 말씀드리다’에서 사용한 조사예요." },
      { id: "future-tense", topic: "시간 표현", before: "미래 시제는 선어말 어미 ", after: ", ‘-(으)ㄹ’, ‘-(으)ㄹ 것’ 등으로 실현한다.", answers: ["-겠-", "겠"], hint: "‘내일 출발하겠다’에 들어 있는 표현이에요." },
      { id: "passive-expression", topic: "피동 표현", before: "피동은 피동 접미사와 ‘-되다·-당하다·", after: "’ 등으로 실현한다.", answers: ["-어지다", "어지다", "-아지다", "아지다"], hint: "‘문이 열어졌다’에서 피동을 나타내는 부분을 살펴보세요." },
      { id: "causative-expression", topic: "사동 표현", before: "사동은 사동 접미사와 ‘", after: "’ 또는 ‘-게 하다’ 등으로 실현한다.", answers: ["-시키다", "시키다"], hint: "어떤 동작을 하도록 만든다는 뜻의 표현이에요." },
      { id: "negative-expression", topic: "부정 표현", before: "짧은 부정은 부정 부사 ‘", after: "’ 또는 ‘못’을 사용한다.", answers: ["안"], hint: "의지에 따른 부정을 나타내는 한 글자 부사예요." },
      { id: "indirect-quotation", topic: "인용 표현", before: "직접 인용을 ", after: "으로 바꿀 때에는 대명사·높임·시간·지시 표현을 화자의 관점에 맞게 고친다.", answers: ["간접 인용", "간접인용", "간접 인용 표현", "간접인용표현"], hint: "원문을 그대로 옮기지 않고 의미를 전달하는 방식이에요." }
    ]
  }
];

function normalizeSummaryAnswer(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR").replace(/[\s‘’'"“”]/g, "");
}

export function isGrammarSummaryAnswerCorrect(blank: GrammarSummaryBlank, value: string) {
  const normalized = normalizeSummaryAnswer(value);
  return normalized.length > 0 && blank.answers.some((answer) => normalizeSummaryAnswer(answer) === normalized);
}

export type GrammarSummaryFeedback = {
  kind: "correct" | "retry";
  message: string;
};

export function getGrammarSummaryFeedback(
  blank: GrammarSummaryBlank,
  value: string,
  submitted: boolean
): GrammarSummaryFeedback | null {
  if (!submitted || !value.trim()) return null;
  if (isGrammarSummaryAnswerCorrect(blank, value)) {
    return { kind: "correct", message: "맞게 정리했어요." };
  }
  return { kind: "retry", message: blank.hint };
}
