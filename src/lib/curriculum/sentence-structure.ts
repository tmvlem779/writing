export type ConceptExample = {
  sentence: string;
  note: string;
};

export type ConceptCheckOption = {
  id: string;
  label: string;
};

export type ConceptLesson = {
  id: "sentence-and-clause" | "connected-sentences" | "embedded-sentences" | "structure-and-effect";
  step: number;
  title: string;
  summary: string;
  inquiryQuestion: string;
  examples: ConceptExample[];
  keyPoints: string[];
  check: {
    prompt: string;
    options: ConceptCheckOption[];
    answer: string;
    feedback: string;
    reflection: string;
  };
};

export const sentenceStructureSource = {
  curriculum: "2022 개정 교육과정 고등학교 화법과 언어",
  section: "문장의 구조",
  pages: "88~95쪽",
  note: "교과서의 개념 흐름을 바탕으로 수업용 설명과 예문을 새로 구성함"
} as const;

export const sentenceStructureLessons: ConceptLesson[] = [
  {
    id: "sentence-and-clause",
    step: 1,
    title: "문장은 어떻게 커질까?",
    summary: "주어와 서술어의 관계가 몇 번 나타나는지 살피면 홑문장과 겹문장을 구분할 수 있어요.",
    inquiryQuestion: "두 문장에서 주어와 서술어가 짝을 이루는 횟수는 어떻게 다를까요?",
    examples: [
      { sentence: "종이 울렸다.", note: "주어·서술어 관계가 한 번 나타나는 홑문장" },
      { sentence: "종이 울리자 학생들이 교실로 들어갔다.", note: "두 절이 결합한 겹문장" }
    ],
    keyPoints: [
      "절은 주어와 서술어의 관계를 갖춘 단위예요.",
      "홑문장은 주어·서술어 관계가 한 번, 겹문장은 두 번 이상 나타나요.",
      "겹문장은 절을 잇거나 한 절을 다른 절 안에 넣어 만들어요."
    ],
    check: {
      prompt: "‘해가 지고 운동장에 조명이 켜졌다.’를 가장 알맞게 설명한 것은 무엇일까요?",
      options: [
        { id: "simple", label: "주어·서술어 관계가 한 번인 홑문장" },
        { id: "complex", label: "두 절이 결합한 겹문장" },
        { id: "phrase", label: "주어·서술어 관계가 없는 구" }
      ],
      answer: "complex",
      feedback: "‘해가 지다’와 ‘조명이 켜지다’라는 두 절이 결합했으므로 겹문장이에요.",
      reflection: "두 절을 각각 찾아 말해 보세요."
    }
  },
  {
    id: "connected-sentences",
    step: 2,
    title: "절과 절은 어떻게 이어질까?",
    summary: "이어진문장은 앞절과 뒤 절의 의미 관계가 대등한지, 한쪽이 다른 쪽에 기대는지에 따라 나뉘어요.",
    inquiryQuestion: "두 문장의 연결 관계를 바꾸면 사건 사이의 관계가 어떻게 달라질까요?",
    examples: [
      { sentence: "하늘이 맑고 바람이 선선하다.", note: "두 절이 나란히 놓인 대등한 연결" },
      { sentence: "비가 그쳐서 운동장을 사용할 수 있었다.", note: "앞절이 원인을 나타내는 종속적인 연결" }
    ],
    keyPoints: [
      "대등한 연결은 나열·대조·선택처럼 앞뒤 절이 나란한 관계를 이루어요.",
      "종속적인 연결은 원인·조건·의도처럼 한 절이 다른 절의 의미를 보충해요.",
      "연결 어미를 고를 때는 형태뿐 아니라 문맥 속 의미 관계를 함께 살펴야 해요."
    ],
    check: {
      prompt: "‘비가 오면 창문을 닫아라.’의 절 사이 관계는 무엇일까요?",
      options: [
        { id: "coordinate", label: "대등하게 이어진 관계" },
        { id: "subordinate", label: "조건을 나타내는 종속적인 관계" },
        { id: "embedded", label: "한 절이 문장 성분으로 안긴 관계" }
      ],
      answer: "subordinate",
      feedback: "앞절 ‘비가 오면’이 뒤 절의 행동이 이루어질 조건을 나타내요.",
      reflection: "연결 어미 ‘-면’을 ‘-지만’으로 바꾸면 의미가 어떻게 달라질까요?"
    }
  },
  {
    id: "embedded-sentences",
    step: 3,
    title: "한 절이 다른 절 안에 들어가면?",
    summary: "안은문장에서는 안긴절이 문장 전체 안에서 명사·관형어·부사어·서술어 또는 인용된 내용의 역할을 해요.",
    inquiryQuestion: "밑줄 친 절이 문장 안에서 어떤 성분처럼 기능하는지 살펴보세요.",
    examples: [
      { sentence: "우리는 그가 약속을 지켰음을 알았다.", note: "‘그가 약속을 지켰음’이 목적어 역할을 하는 명사절" },
      { sentence: "도서관에서 빌린 책이 재미있다.", note: "‘도서관에서 빌린’이 ‘책’을 꾸미는 관형절" },
      { sentence: "친구가 놀라도록 크게 웃었다.", note: "‘친구가 놀라도록’이 동작을 꾸미는 부사절" },
      { sentence: "우리 반은 분위기가 밝다.", note: "‘분위기가 밝다’가 전체 문장의 서술어 역할을 하는 서술절" },
      { sentence: "민지는 내일 출발하겠다고 말했다.", note: "‘내일 출발하겠다’가 인용된 내용인 인용절" }
    ],
    keyPoints: [
      "안긴절의 이름은 문장 안에서 맡은 기능을 기준으로 붙여요.",
      "명사절·관형절·부사절·서술절·인용절의 다섯 종류가 있어요.",
      "안긴절의 경계를 찾은 뒤 그 절이 무엇을 꾸미거나 대신하는지 확인해 보세요."
    ],
    check: {
      prompt: "‘친구가 추천한 책을 읽었다.’에서 ‘친구가 추천한’은 어떤 절일까요?",
      options: [
        { id: "noun", label: "명사절" },
        { id: "adnominal", label: "관형절" },
        { id: "quotation", label: "인용절" }
      ],
      answer: "adnominal",
      feedback: "‘친구가 추천한’은 뒤의 명사 ‘책’을 꾸미므로 관형절이에요.",
      reflection: "관형절을 빼면 어떤 정보가 사라지는지 설명해 보세요."
    }
  },
  {
    id: "structure-and-effect",
    step: 4,
    title: "왜 구조를 바꾸어 쓸까?",
    summary: "문장 구조는 내용을 묶는 방식뿐 아니라 정보의 관계, 강조점, 장면의 느낌에도 영향을 줘요.",
    inquiryQuestion: "같은 사건을 여러 문장으로 나눌 때와 한 문장으로 묶을 때 독자가 받는 정보는 어떻게 달라질까요?",
    examples: [
      { sentence: "비가 내렸다. 운동회가 연기되었다.", note: "두 사건을 각각 제시해 독자가 관계를 추론하게 함" },
      { sentence: "비가 내려서 운동회가 연기되었다.", note: "원인과 결과의 관계를 분명히 드러냄" },
      { sentence: "비에 젖은 운동장은 사용할 수 없었다.", note: "관형절로 운동장의 상태를 배경 정보처럼 덧붙임" }
    ],
    keyPoints: [
      "이어진문장은 사건 사이의 나열·대조·원인·조건 같은 관계를 드러낼 수 있어요.",
      "안은문장은 한 정보를 다른 정보의 성분으로 넣어 강조하거나 배경화할 수 있어요.",
      "좋은 구조는 언제나 하나가 아니라 글의 목적과 맥락에 따라 달라져요."
    ],
    check: {
      prompt: "원인과 결과를 가장 분명하게 보여 주는 문장을 골라 보세요.",
      options: [
        { id: "separate", label: "기온이 내려갔다. 길이 얼었다." },
        { id: "causal", label: "기온이 내려가서 길이 얼었다." },
        { id: "contrast", label: "기온은 내려갔지만 길은 얼지 않았다." }
      ],
      answer: "causal",
      feedback: "‘-아서/어서’로 연결하면 앞 사건이 원인이고 뒤 사건이 결과임을 분명히 나타낼 수 있어요.",
      reflection: "첫 번째 문장이 더 어울리는 상황도 있을까요? 글의 목적을 떠올려 보세요."
    }
  }
];

export function evaluateConceptCheck(lessonId: ConceptLesson["id"], optionId: string) {
  const lesson = sentenceStructureLessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  return {
    correct: lesson.check.answer === optionId,
    feedback: lesson.check.feedback,
    reflection: lesson.check.reflection
  };
}
