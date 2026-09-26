export type ConceptExample = {
  sentence: string;
  note: string;
};

export type ConceptCheckOption = {
  id: string;
  label: string;
};

export type ConceptLesson = {
  id: string;
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
    id: "embedded-basic",
    step: 3,
    title: "한 절이 문장 성분이 되면?",
    summary: "안긴절은 문장 전체 안에서 명사·관형어·부사어처럼 기능할 수 있어요.",
    inquiryQuestion: "밑줄 친 절이 문장 안에서 어떤 성분처럼 기능하는지 살펴보세요.",
    examples: [
      { sentence: "우리는 그가 약속을 지켰음을 알았다.", note: "‘그가 약속을 지켰음’이 목적어 역할을 하는 명사절" },
      { sentence: "도서관에서 빌린 책이 재미있다.", note: "‘도서관에서 빌린’이 ‘책’을 꾸미는 관형절" },
      { sentence: "친구가 놀라도록 크게 웃었다.", note: "‘친구가 놀라도록’이 동작을 꾸미는 부사절" }
    ],
    keyPoints: [
      "안긴절의 이름은 문장 안에서 맡은 기능을 기준으로 붙여요.",
      "명사절은 명사처럼, 관형절은 명사를 꾸미는 말처럼, 부사절은 용언을 꾸미는 말처럼 기능해요.",
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
    id: "embedded-advanced-effect",
    step: 4,
    title: "복잡한 구조는 의미를 어떻게 바꿀까?",
    summary: "서술절과 인용절을 비롯한 안긴절의 배치에 따라 강조점이 달라지거나 문장이 여러 뜻으로 해석될 수 있어요.",
    inquiryQuestion: "안긴절의 경계나 꾸밈 관계가 달라지면 문장의 뜻은 어떻게 달라질까요?",
    examples: [
      { sentence: "우리 반은 분위기가 밝다.", note: "‘분위기가 밝다’가 전체 문장의 서술어 역할을 하는 서술절" },
      { sentence: "민지는 내일 출발하겠다고 말했다.", note: "‘내일 출발하겠다’가 인용된 내용인 인용절" },
      { sentence: "나는 어제 온 친구의 동생을 만났다.", note: "‘어제 온’이 무엇을 꾸미는지에 따라 뜻이 달라질 수 있는 문장" }
    ],
    keyPoints: [
      "서술절은 문장 전체의 서술어 역할을 하고, 인용절은 말이나 생각의 내용을 담아요.",
      "꾸밈 관계나 절의 경계가 분명하지 않으면 문장이 둘 이상의 뜻으로 해석될 수 있어요.",
      "중의적인 문장은 어순을 바꾸거나 필요한 성분을 덧붙여 뜻을 분명하게 만들 수 있어요."
    ],
    check: {
      prompt: "‘지수는 동생이 모범생이다.’에서 ‘동생이 모범생이다’는 어떤 역할을 할까요?",
      options: [
        { id: "predicate", label: "전체 문장의 서술어 역할을 하는 서술절" },
        { id: "quotation", label: "말이나 생각을 옮긴 인용절" },
        { id: "adnominal", label: "뒤의 명사를 꾸미는 관형절" }
      ],
      answer: "predicate",
      feedback: "‘동생이 모범생이다’는 주어 ‘지수는’에 대해 서술하는 역할을 하므로 서술절이에요.",
      reflection: "서술절 안의 주어와 서술어도 각각 찾아보세요."
    }
  },
  {
    id: "synthesis-generation",
    step: 5,
    title: "의도에 맞는 구조를 어떻게 고를까?",
    summary: "같은 내용도 홑문장·이어진문장·안은문장 가운데 무엇을 선택하느냐에 따라 관계와 강조점이 달라져요.",
    inquiryQuestion: "내가 강조하려는 정보와 글의 목적에 가장 알맞은 문장 구조는 무엇일까요?",
    examples: [
      { sentence: "비가 내렸다. 운동회가 연기되었다.", note: "두 사건을 각각 제시해 관계를 독자가 추론하게 함" },
      { sentence: "비가 내려서 운동회가 연기되었다.", note: "이어진문장으로 원인과 결과를 분명히 드러냄" },
      { sentence: "비로 연기된 운동회가 다음 주에 열린다.", note: "관형절로 연기된 사실을 배경 정보처럼 제시함" }
    ],
    keyPoints: [
      "문장을 만들기 전에 전달할 핵심 의미와 독자를 먼저 정해요.",
      "구조를 분석한 뒤 그 선택이 정보 관계와 강조점에 미친 효과를 설명해요.",
      "피드백은 정답을 대신 정하는 것이 아니라 표현 의도가 더 잘 드러나는지 확인하는 자료예요."
    ],
    check: {
      prompt: "원인과 결과를 가장 분명하게 보여 주는 문장을 골라 보세요.",
      options: [
        { id: "separate", label: "기온이 내려갔다. 길이 얼었다." },
        { id: "causal", label: "기온이 내려가서 길이 얼었다." },
        { id: "background", label: "기온이 내려간 길에서 사람들이 걸었다." }
      ],
      answer: "causal",
      feedback: "‘-아서/어서’로 연결하면 앞 사건이 원인이고 뒤 사건이 결과임을 분명히 나타낼 수 있어요.",
      reflection: "다른 두 문장이 더 어울릴 수 있는 상황도 목적과 독자를 떠올려 설명해 보세요."
    }
  }
];

export function evaluateConceptCheck(lessonId: string, optionId: string) {
  const lesson = sentenceStructureLessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  return {
    correct: lesson.check.answer === optionId,
    feedback: lesson.check.feedback,
    reflection: lesson.check.reflection
  };
}
