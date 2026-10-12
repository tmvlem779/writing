import { errorCorrectionItems } from "../curriculum/error-correction.ts";
import { grammarElementLessons } from "../curriculum/grammar-elements.ts";
import { sentenceStructureLessons, type ConceptCheck } from "../curriculum/sentence-structure.ts";
import { grammarDiagnosticQuestions } from "../diagnosis/grammar-diagnostic.ts";

export type WrongNoteSource = "diagnosis" | "challenge" | "self-study";

export type WrongNoteRecord = {
  id: string;
  source: WrongNoteSource;
  problemId: string;
  problemTitle: string;
  question: string;
  submittedAnswer: string;
  feedbackHint: string;
};

export type WrongNotePracticeQuestion = {
  id: "original" | "similar-1" | "similar-2";
  label: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionIds: string[];
  hint: string;
  explanation: string;
  multiple: boolean;
};

export type PublicWrongNotePracticeQuestion = Omit<WrongNotePracticeQuestion, "correctOptionIds">;

export type WrongNotePractice = {
  noteId: string;
  questions: [WrongNotePracticeQuestion, WrongNotePracticeQuestion, WrongNotePracticeQuestion];
};

type PracticeKind =
  | "sentence-core"
  | "clause-count"
  | "connected-relation"
  | "embedded-clause"
  | "speech-ending"
  | "honorific-time"
  | "negation"
  | "causative-passive"
  | "quotation"
  | "context";

type VariantSeed = Omit<WrongNotePracticeQuestion, "id" | "label">;

const variantBank: Record<PracticeKind, [VariantSeed, VariantSeed]> = {
  "sentence-core": [
    {
      prompt: "‘고양이가 창가에서 잔다.’의 주어와 서술어를 바르게 짝지은 것은 무엇인가요?",
      options: [
        { id: "a", label: "고양이가 — 잔다" },
        { id: "b", label: "창가에서 — 잔다" },
        { id: "c", label: "고양이가 — 창가에서" },
        { id: "d", label: "창가에서 — 고양이가" }
      ],
      correctOptionIds: ["a"],
      hint: "누가 어떤 상태인지 나타내는 두 말을 찾아보세요.",
      explanation: "‘고양이가’가 상태의 주체이고 ‘잔다’가 그 상태를 나타냅니다.",
      multiple: false
    },
    {
      prompt: "‘민수가 동생에게 편지를 썼다.’에서 문장의 골격을 이루는 두 성분은 무엇인가요?",
      options: [
        { id: "a", label: "민수가 — 썼다" },
        { id: "b", label: "동생에게 — 편지를" },
        { id: "c", label: "민수가 — 편지를" },
        { id: "d", label: "편지를 — 동생에게" }
      ],
      correctOptionIds: ["a"],
      hint: "행동의 주체와 그 행동을 나타내는 말을 찾으세요.",
      explanation: "주어 ‘민수가’와 서술어 ‘썼다’가 문장의 기본 골격을 이룹니다.",
      multiple: false
    }
  ],
  "clause-count": [
    {
      prompt: "‘눈이 내리고 바람이 분다.’가 겹문장인 근거는 무엇인가요?",
      options: [
        { id: "a", label: "단어가 다섯 개이기 때문" },
        { id: "b", label: "주어·서술어 관계가 두 번 나타나기 때문" },
        { id: "c", label: "조사가 두 개이기 때문" },
        { id: "d", label: "문장이 길기 때문" }
      ],
      correctOptionIds: ["b"],
      hint: "‘눈이-내리고’와 ‘바람이-분다’를 각각 살펴보세요.",
      explanation: "주어·서술어 관계가 두 번 나타나므로 겹문장입니다.",
      multiple: false
    },
    {
      prompt: "다음 중 홑문장은 무엇인가요?",
      options: [
        { id: "a", label: "비가 오고 바람이 분다." },
        { id: "b", label: "종이 울리자 학생들이 들어왔다." },
        { id: "c", label: "학생이 도서관에서 책을 읽는다." },
        { id: "d", label: "해가 지면 조명이 켜진다." }
      ],
      correctOptionIds: ["c"],
      hint: "주어·서술어 관계가 한 번만 나타나는 문장을 찾으세요.",
      explanation: "‘학생이-읽는다’의 한 관계만 있으므로 홑문장입니다.",
      multiple: false
    }
  ],
  "connected-relation": [
    {
      prompt: "‘비가 와서 운동회가 연기되었다.’의 절 사이 의미 관계는 무엇인가요?",
      options: [
        { id: "a", label: "나열" },
        { id: "b", label: "대조" },
        { id: "c", label: "원인과 결과" },
        { id: "d", label: "선택" }
      ],
      correctOptionIds: ["c"],
      hint: "운동회가 연기된 까닭이 앞절에 있는지 살펴보세요.",
      explanation: "비가 온 일이 원인이고 운동회가 연기된 일이 결과입니다.",
      multiple: false
    },
    {
      prompt: "‘시간이 부족하지만 끝까지 검토했다.’에 드러난 의미 관계는 무엇인가요?",
      options: [
        { id: "a", label: "조건" },
        { id: "b", label: "대조" },
        { id: "c", label: "나열" },
        { id: "d", label: "원인" }
      ],
      correctOptionIds: ["b"],
      hint: "앞절에서 예상되는 결과와 실제 뒤 절의 내용이 같은지 살펴보세요.",
      explanation: "시간이 부족한 상황과 끝까지 검토한 행동이 대조됩니다.",
      multiple: false
    }
  ],
  "embedded-clause": [
    {
      prompt: "‘누나가 만든 쿠키를 먹었다.’에서 ‘누나가 만든’은 어떤 절인가요?",
      options: [
        { id: "a", label: "명사절" },
        { id: "b", label: "관형절" },
        { id: "c", label: "부사절" },
        { id: "d", label: "인용절" }
      ],
      correctOptionIds: ["b"],
      hint: "바로 뒤의 명사 ‘쿠키’를 어떤 말이 꾸미는지 살펴보세요.",
      explanation: "‘누나가 만든’은 뒤의 명사 ‘쿠키’를 꾸미는 관형절입니다.",
      multiple: false
    },
    {
      prompt: "‘우리는 함께 여행하기를 바란다.’에서 ‘함께 여행하기’의 역할은 무엇인가요?",
      options: [
        { id: "a", label: "주어 역할" },
        { id: "b", label: "목적어 역할" },
        { id: "c", label: "관형어 역할" },
        { id: "d", label: "독립어 역할" }
      ],
      correctOptionIds: ["b"],
      hint: "‘무엇을 바란다’라고 물었을 때 답이 되는 부분을 찾으세요.",
      explanation: "‘함께 여행하기’는 ‘바란다’의 목적어 역할을 하는 명사절입니다.",
      multiple: false
    }
  ],
  "speech-ending": [
    {
      prompt: "‘창문을 닫아 줄래?’의 문장 형식과 실제 기능을 바르게 설명한 것은 무엇인가요?",
      options: [
        { id: "a", label: "의문문 형식으로 부탁함" },
        { id: "b", label: "명령문 형식으로 질문함" },
        { id: "c", label: "평서문 형식으로 감탄함" },
        { id: "d", label: "청유문 형식으로 약속함" }
      ],
      correctOptionIds: ["a"],
      hint: "문장 끝의 형식과 상대에게 기대하는 행동을 나누어 보세요.",
      explanation: "의문문 형식을 사용했지만 실제로는 창문을 닫아 달라고 부탁합니다.",
      multiple: false
    },
    {
      prompt: "함께 청소하자고 제안할 때 가장 알맞은 문장은 무엇인가요?",
      options: [
        { id: "a", label: "교실을 청소했니?" },
        { id: "b", label: "교실을 청소해라." },
        { id: "c", label: "교실을 함께 청소하자." },
        { id: "d", label: "교실이 깨끗하다." }
      ],
      correctOptionIds: ["c"],
      hint: "말하는 사람과 듣는 사람이 함께 행동하는 표현을 찾으세요.",
      explanation: "‘-자’는 말하는 이와 듣는 이가 함께 행동하자는 청유 표현입니다.",
      multiple: false
    }
  ],
  "honorific-time": [
    {
      prompt: "‘할머니께서 방에 들어오셨다.’에 사용된 표현을 바르게 설명한 것은 무엇인가요?",
      options: [
        { id: "a", label: "주체 높임과 과거 시제" },
        { id: "b", label: "객체 높임과 미래 시제" },
        { id: "c", label: "상대 높임과 현재 시제" },
        { id: "d", label: "주체 낮춤과 진행상" }
      ],
      correctOptionIds: ["a"],
      hint: "‘께서·-시-’가 높이는 대상과 ‘-었-’이 나타내는 시간을 나누어 보세요.",
      explanation: "‘께서·-시-’는 주체를 높이고 ‘-었-’은 과거를 나타냅니다.",
      multiple: false
    },
    {
      prompt: "‘학생들이 지금 운동장에서 뛰고 있다.’의 시간 표현은 무엇인가요?",
      options: [
        { id: "a", label: "과거 완료" },
        { id: "b", label: "현재 진행" },
        { id: "c", label: "미래 예정" },
        { id: "d", label: "과거 회상" }
      ],
      correctOptionIds: ["b"],
      hint: "‘지금’과 ‘-고 있다’가 나타내는 시간을 살펴보세요.",
      explanation: "‘지금’과 ‘-고 있다’는 현재 진행 중인 동작을 나타냅니다.",
      multiple: false
    }
  ],
  negation: [
    {
      prompt: "비가 너무 많이 와서 축구를 할 수 없었던 상황에 알맞은 문장은 무엇인가요?",
      options: [
        { id: "a", label: "나는 축구를 하지 않았다." },
        { id: "b", label: "나는 축구를 하지 못했다." },
        { id: "c", label: "나는 축구를 하지 않는다." },
        { id: "d", label: "나는 축구를 하지 말았다." }
      ],
      correctOptionIds: ["b"],
      hint: "의지가 아니라 외부 상황 때문에 할 수 없었다는 점에 주목하세요.",
      explanation: "상황 때문에 실행할 수 없었으므로 ‘못’ 부정이 알맞습니다.",
      multiple: false
    },
    {
      prompt: "스스로 선택해 간식을 먹지 않은 상황에 알맞은 문장은 무엇인가요?",
      options: [
        { id: "a", label: "나는 간식을 먹지 않았다." },
        { id: "b", label: "나는 간식을 먹지 못했다." },
        { id: "c", label: "나는 간식을 먹게 했다." },
        { id: "d", label: "간식이 먹혔다." }
      ],
      correctOptionIds: ["a"],
      hint: "능력이 없었던 것이 아니라 선택해서 하지 않은 상황입니다.",
      explanation: "의지로 행동하지 않았으므로 ‘안/지 않다’ 부정이 알맞습니다.",
      multiple: false
    }
  ],
  "causative-passive": [
    {
      prompt: "‘어머니가 아이에게 외투를 입혔다.’에 새로 더해진 의미는 무엇인가요?",
      options: [
        { id: "a", label: "아이가 스스로 외투를 벗었다." },
        { id: "b", label: "어머니가 아이에게 외투를 입도록 했다." },
        { id: "c", label: "외투가 저절로 입혀졌다." },
        { id: "d", label: "아이가 외투를 입지 못했다." }
      ],
      correctOptionIds: ["b"],
      hint: "행동을 하게 한 사람과 실제 행동의 대상을 구분하세요.",
      explanation: "어머니가 아이에게 외투를 입도록 한 사동의 의미가 드러납니다.",
      multiple: false
    },
    {
      prompt: "‘바람이 창문을 열었다.’를 피동 표현으로 바꾼 문장은 무엇인가요?",
      options: [
        { id: "a", label: "창문이 바람에 열렸다." },
        { id: "b", label: "창문이 바람을 열었다." },
        { id: "c", label: "바람이 창문에게 열렸다." },
        { id: "d", label: "창문이 바람에 열게 했다." }
      ],
      correctOptionIds: ["a"],
      hint: "동작을 당한 ‘창문’이 주어가 되는 문장을 찾으세요.",
      explanation: "피동문에서는 동작을 당한 대상인 ‘창문’이 주어가 됩니다.",
      multiple: false
    }
  ],
  quotation: [
    {
      prompt: "지수가 ‘나는 오늘 도서관에 갈 거야.’라고 한 말을 간접 인용한 문장은 무엇인가요?",
      options: [
        { id: "a", label: "지수는 자기가 오늘 도서관에 갈 것이라고 말했다." },
        { id: "b", label: "지수는 내가 오늘 도서관에 간다고 말했다." },
        { id: "c", label: "지수는 ‘나는 오늘 도서관에 갈 거야.’라고 말했다." },
        { id: "d", label: "지수는 자기가 어제 도서관에 갔다고 말했다." }
      ],
      correctOptionIds: ["a"],
      hint: "말한 사람의 ‘나’를 옮겨 말할 때 누구로 바뀌는지 살펴보세요.",
      explanation: "지수의 말을 옮기므로 ‘나’는 ‘자기’로 바뀌고 ‘것이라고’를 사용합니다.",
      multiple: false
    },
    {
      prompt: "‘민호가 “내일 일찍 오겠습니다.”라고 말했다.’를 간접 인용한 문장은 무엇인가요?",
      options: [
        { id: "a", label: "민호가 다음 날 일찍 오겠다고 말했다." },
        { id: "b", label: "민호가 “내일 일찍 오겠습니다.”고 말했다." },
        { id: "c", label: "민호가 어제 일찍 왔다고 말했다." },
        { id: "d", label: "민호가 내가 일찍 온다고 말했다." }
      ],
      correctOptionIds: ["a"],
      hint: "직접 인용의 ‘내일’과 종결 표현을 옮겨 말하는 방식으로 바꾸세요.",
      explanation: "간접 인용에서는 시점을 ‘다음 날’로 조정하고 ‘-겠다고’를 사용합니다.",
      multiple: false
    }
  ],
  context: [
    {
      prompt: "학생 대상 공식 안내문에 가장 알맞은 문장은 무엇인가요?",
      options: [
        { id: "a", label: "내일 준비물 꼭 챙겨!" },
        { id: "b", label: "학생 여러분은 내일까지 준비물을 제출해 주시기 바랍니다." },
        { id: "c", label: "준비물 내는 거 알지?" },
        { id: "d", label: "아마 준비물을 낼지도 몰라." }
      ],
      correctOptionIds: ["b"],
      hint: "공식 안내의 독자와 목적에 맞는 높임과 종결 표현을 살펴보세요.",
      explanation: "공식 안내에는 독자를 존중하면서 요청을 분명히 전하는 표현이 알맞습니다.",
      multiple: false
    },
    {
      prompt: "친구에게 보낸 부탁을 학교 전체 공지로 바꿀 때 가장 먼저 확인할 것은 무엇인가요?",
      options: [
        { id: "a", label: "글자 수가 가장 짧은지" },
        { id: "b", label: "독자와 목적에 맞는 높임과 표현인지" },
        { id: "c", label: "영어 단어가 들어가는지" },
        { id: "d", label: "문장이 한 개인지" }
      ],
      correctOptionIds: ["b"],
      hint: "누가 읽고 무엇을 하게 할 글인지 먼저 생각하세요.",
      explanation: "독자와 목적이 달라지면 높임과 요청 방식도 함께 조정해야 합니다.",
      multiple: false
    }
  ]
};

const errorVariantBank: Record<string, [VariantSeed, VariantSeed]> = {
  "place-particle": [
    errorVariant("민지는 도서관을 책을 읽었다.", ["민지는", "도서관을", "책을", "읽었다."], 1, "장소에서 행동이 일어남을 나타내는 조사를 살펴보세요.", "‘도서관에서’처럼 행동이 일어난 장소에는 ‘에서’를 씁니다."),
    errorVariant("학생들이 교실을 토론했다.", ["학생들이", "교실을", "토론했다."], 1, "토론이 이루어진 장소에 붙은 조사를 살펴보세요.", "행동이 이루어진 장소이므로 ‘교실에서’가 알맞습니다.")
  ],
  "past-tense": [
    errorVariant("우리는 어제 박물관에 간다.", ["우리는", "어제", "박물관에", "간다."], 3, "‘어제’와 문장 끝의 시간이 맞는지 살펴보세요.", "지난 일을 말하므로 ‘갔다’와 같은 과거 시제가 알맞습니다."),
    errorVariant("지난주에 친구를 만날 것이다.", ["지난주에", "친구를", "만날", "것이다."], 2, "이미 지난 시간과 미래 표현이 함께 쓰였는지 살펴보세요.", "지난 일을 말하므로 ‘만났다’로 고쳐야 합니다.")
  ],
  "subject-honorific": [
    errorVariant("할아버지께서 아침을 먹었다.", ["할아버지께서", "아침을", "먹었다."], 2, "높여야 할 주체의 행동을 나타내는 말을 살펴보세요.", "주체인 할아버지를 높여 ‘드셨다’라고 표현합니다."),
    errorVariant("교장 선생님께서 강당에 왔다.", ["교장 선생님께서", "강당에", "왔다."], 2, "주체를 높이는 선어말 어미가 있는지 살펴보세요.", "높여야 할 주체이므로 ‘오셨다’가 알맞습니다.")
  ],
  "double-passive": [
    errorVariant("문제가 쉽게 풀려졌다.", ["문제가", "쉽게", "풀려졌다."], 2, "피동의 뜻이 한 서술어에 두 번 나타나는지 살펴보세요.", "‘풀리다’에 피동의 뜻이 있으므로 ‘풀렸다’가 자연스럽습니다."),
    errorVariant("행사 일정이 변경되어졌다.", ["행사", "일정이", "변경되어졌다."], 2, "‘되다’와 ‘-어지다’가 겹치는지 살펴보세요.", "피동 표현을 겹치지 않고 ‘변경되었다’라고 씁니다.")
  ],
  "honorific-subject": [
    errorVariant("선생님이 질문에 답해 드렸다.", ["선생님이", "질문에", "답해 드렸다."], 2, "행동의 주체가 누구인지 살펴보세요.", "선생님의 행동을 높여 ‘답해 주셨다’라고 표현합니다."),
    errorVariant("교수님이 학생에게 설명드렸다.", ["교수님이", "학생에게", "설명드렸다."], 2, "높여야 하는 사람이 행동의 주체인지 확인하세요.", "주체인 교수님을 높여 ‘설명하셨다’라고 씁니다.")
  ],
  "quotation-ending": [
    errorVariant("민수는 곧 출발할 거야라고 말했다.", ["민수는", "곧", "출발할", "거야라고", "말했다."], 3, "간접 인용에서 ‘것이라고’가 어떻게 줄어드는지 떠올려 보세요.", "간접 인용에서는 ‘거라고’라고 표현합니다."),
    errorVariant("지수는 시험이 어렵대라고 말했다.", ["지수는", "시험이", "어렵대라고", "말했다."], 2, "전달 표현과 인용 조사가 겹쳤는지 살펴보세요.", "‘어렵다고 말했다’처럼 간접 인용 어미를 한 번만 씁니다.")
  ]
};

function errorVariant(prompt: string, tokens: string[], incorrectIndex: number, hint: string, explanation: string): VariantSeed {
  return {
    prompt: `‘${prompt}’에서 문법적으로 잘못된 부분을 고르세요.`,
    options: tokens.map((label, index) => ({ id: String(index), label })),
    correctOptionIds: [String(incorrectIndex)],
    hint,
    explanation,
    multiple: false
  };
}

const conceptCatalog = [...sentenceStructureLessons, ...grammarElementLessons].flatMap((lesson) =>
  [lesson.check, ...(lesson.extraChecks ?? [])].map((check, index) => ({ lessonId: lesson.id, index, check }))
);

function classifyPractice(prompt: string, problemId: string): PracticeKind {
  const value = `${problemId} ${prompt}`;
  if (/인용|따옴표|말했다|quotation/.test(value)) return "quotation";
  if (/부정|못했다|않았다|negation/.test(value)) return "negation";
  if (/피동|사동|먹였다|열렸다|voice|causative/.test(value)) return "causative-passive";
  if (/종결|형식과 실제|부탁|명령|청유/.test(value)) return "speech-ending";
  if (/높임|시제|시간 표현|께서|드렸다|진행/.test(value)) return "honorific-time";
  if (/안긴|안은|명사절|관형절|부사절|서술절|embedded/.test(value)) return "embedded-clause";
  if (/의미 관계|절 사이|원인|결과|대조|조건|이어진|connected/.test(value)) return "connected-relation";
  if (/겹문장|홑문장|관계가 두 번|clause-count/.test(value)) return "clause-count";
  if (/공식|안내|독자|목적|맥락|synthesis/.test(value)) return "context";
  return "sentence-core";
}

function originalFromConceptCheck(check: ConceptCheck): WrongNotePracticeQuestion {
  return {
    id: "original",
    label: "기존 오답 다시 풀기",
    prompt: check.prompt,
    options: check.options,
    correctOptionIds: [check.answer],
    hint: check.retryHint ?? check.reflection,
    explanation: check.feedback,
    multiple: false
  };
}

function buildOriginalQuestion(note: WrongNoteRecord): WrongNotePracticeQuestion | null {
  const diagnosticId = note.problemId.replace(/^daily-concept-/, "");
  const diagnostic = grammarDiagnosticQuestions.find((question) => question.id === diagnosticId || question.prompt === note.question);
  if (diagnostic) {
    return {
      id: "original",
      label: "기존 오답 다시 풀기",
      prompt: diagnostic.prompt,
      options: diagnostic.options,
      correctOptionIds: [diagnostic.answer],
      hint: diagnostic.retryHint,
      explanation: diagnostic.explanation,
      multiple: false
    };
  }

  const concept = conceptCatalog.find(({ check }) => check.prompt === note.question);
  if (concept) return originalFromConceptCheck(concept.check);

  const errorItem = errorCorrectionItems.find((item) =>
    note.problemId.endsWith(item.id) || note.question.includes(item.tokens.join(" "))
  );
  if (errorItem) {
    return {
      id: "original",
      label: "기존 오답 다시 풀기",
      prompt: note.question,
      options: errorItem.tokens.map((label, index) => ({ id: String(index), label })),
      correctOptionIds: errorItem.incorrectTokenIndexes.map(String),
      hint: errorItem.selectionHint,
      explanation: errorItem.explanation,
      multiple: errorItem.incorrectTokenIndexes.length > 1
    };
  }
  return null;
}

export function buildWrongNotePractice(note: WrongNoteRecord): WrongNotePractice | null {
  const original = buildOriginalQuestion(note);
  if (!original) return null;
  const errorItem = errorCorrectionItems.find((item) => note.problemId.endsWith(item.id));
  const seeds = errorItem ? errorVariantBank[errorItem.id] : variantBank[classifyPractice(note.question, note.problemId)];
  const similar = seeds.map((seed, index) => ({
    ...seed,
    id: `similar-${index + 1}` as "similar-1" | "similar-2",
    label: `비슷한 유형 ${index + 1}`
  })) as [WrongNotePracticeQuestion, WrongNotePracticeQuestion];
  return { noteId: note.id, questions: [original, ...similar] };
}

export function toPublicWrongNotePractice(practice: WrongNotePractice) {
  return {
    noteId: practice.noteId,
    questions: practice.questions.map((question) => ({
      id: question.id,
      label: question.label,
      prompt: question.prompt,
      options: question.options,
      hint: question.hint,
      explanation: question.explanation,
      multiple: question.multiple
    })) as [
      PublicWrongNotePracticeQuestion,
      PublicWrongNotePracticeQuestion,
      PublicWrongNotePracticeQuestion
    ]
  };
}

function sameAnswers(submitted: string[], expected: string[]) {
  return submitted.length === expected.length
    && [...submitted].sort().every((answer, index) => answer === [...expected].sort()[index]);
}

export function checkWrongNotePracticeAnswers(practice: WrongNotePractice, answers: string[][]) {
  if (answers.length === 0 || answers.length > practice.questions.length) return false;
  return answers.every((answer, index) => sameAnswers(answer, practice.questions[index].correctOptionIds));
}
