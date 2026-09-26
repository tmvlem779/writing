import type { ConceptLesson } from "@/lib/curriculum/sentence-structure";

export const grammarElementsSource = {
  curriculum: "2022 개정 교육과정 고등학교 화법과 언어",
  section: "문장의 구조와 문법 요소",
  pages: "86~111쪽",
  note: "교과서의 개념과 탐구 순서를 바탕으로 수업용 설명과 예문을 새로 구성함"
} as const;

export const grammarElementLessons: ConceptLesson[] = [
  {
    id: "grammar-basic-sentence",
    step: 1,
    title: "문장 성분은 어떻게 문장을 만들까?",
    summary: "주어와 서술어를 중심으로 필요한 문장 성분을 조합하면 하나의 사태를 나타내는 홑문장을 만들 수 있어요.",
    inquiryQuestion: "각 성분은 문장에서 어떤 역할을 하며, 어느 성분이 문장의 골격을 이룰까요?",
    examples: [
      { sentence: "학생이 읽는다.", note: "주어와 서술어만으로 이루어진 기본 홑문장" },
      { sentence: "학생이 도서관에서 책을 읽는다.", note: "부사어와 목적어를 더해 정보를 구체화한 홑문장" }
    ],
    keyPoints: [
      "주어·서술어·목적어·보어는 문장의 골격을 이루는 주성분이에요.",
      "관형어와 부사어는 다른 성분을 꾸미고, 독립어는 다른 성분과 직접 관련 없이 쓰여요.",
      "문장을 만든 뒤에는 각 성분의 역할과 주어·서술어 관계가 한 번인지 설명해 보세요."
    ],
    check: {
      prompt: "‘민지가 운동장에서 공을 찬다.’에서 문장의 골격을 가장 알맞게 찾은 것은 무엇일까요?",
      options: [
        { id: "subject-predicate", label: "민지가 / 찬다" },
        { id: "place-object", label: "운동장에서 / 공을" },
        { id: "all-adverbial", label: "모든 성분이 부사어" }
      ],
      answer: "subject-predicate",
      feedback: "‘민지가’는 행동의 주체인 주어이고 ‘찬다’는 주어의 동작을 나타내는 서술어예요.",
      reflection: "목적어와 부사어가 더해 주는 정보를 각각 설명해 보세요."
    }
  },
  {
    id: "grammar-connected-meaning",
    step: 2,
    title: "연결 어미는 어떤 관계를 만들까?",
    summary: "이어진문장은 연결 어미를 통해 나열·대조·선택 또는 원인·조건·의도 같은 의미 관계를 드러내요.",
    inquiryQuestion: "같은 두 홑문장도 연결 어미에 따라 의미 관계가 어떻게 달라질까요?",
    examples: [
      { sentence: "비가 오고 바람이 분다.", note: "두 사태를 나열한 대등하게 이어진문장" },
      { sentence: "비가 와서 경기가 취소되었다.", note: "원인과 결과를 나타낸 종속적으로 이어진문장" },
      { sentence: "비가 오면 경기를 취소한다.", note: "조건과 결과를 나타낸 종속적으로 이어진문장" }
    ],
    keyPoints: [
      "대등한 연결에는 나열·대조·선택이, 종속적인 연결에는 원인·조건·의도 등이 있어요.",
      "‘-고, -지만, -거나’와 ‘-아서/어서, -(으)면, -(으)려고’는 서로 다른 관계를 표시해요.",
      "형태만 찾지 말고 앞절과 뒤 절이 실제로 어떤 의미 관계인지 확인해야 해요."
    ],
    check: {
      prompt: "‘시간이 부족하지만 끝까지 검토했다.’에 드러난 관계는 무엇일까요?",
      options: [
        { id: "contrast", label: "예상과 다른 결과를 잇는 대조 관계" },
        { id: "cause", label: "앞절이 원인인 관계" },
        { id: "condition", label: "앞절이 조건인 관계" }
      ],
      answer: "contrast",
      feedback: "‘-지만’은 시간이 부족하면 검토하기 어렵다는 예상과 실제 결과를 대조해요.",
      reflection: "‘-아서’로 바꾸면 자연스러운지, 의미를 근거로 판단해 보세요."
    }
  },
  {
    id: "grammar-embedded-expansion",
    step: 3,
    title: "한 절을 넣어 문장을 어떻게 확대할까?",
    summary: "짧은 문장을 명사절·관형절·부사절로 바꾸어 다른 문장 속 성분으로 넣으면 정보를 촘촘하게 확장할 수 있어요.",
    inquiryQuestion: "안긴절이 전체 문장에서 명사·관형어·부사어 가운데 어떤 역할을 하나요?",
    examples: [
      { sentence: "나는 친구가 도착했음을 알았다.", note: "‘친구가 도착했음’이 목적어 역할을 하는 명사절" },
      { sentence: "친구가 고른 책을 읽었다.", note: "‘친구가 고른’이 ‘책’을 꾸미는 관형절" },
      { sentence: "친구가 들리도록 크게 말했다.", note: "‘친구가 들리도록’이 ‘말했다’를 꾸미는 부사절" }
    ],
    keyPoints: [
      "명사형 어미 ‘-(으)ㅁ, -기’는 절이 명사처럼 기능하도록 해요.",
      "관형사형 어미 ‘-(으)ㄴ, -는, -(으)ㄹ, -던’은 절이 뒤의 체언을 꾸미도록 해요.",
      "부사형 어미 ‘-도록, -아서/어서, -게’는 절이 뒤의 서술어를 꾸미도록 해요."
    ],
    check: {
      prompt: "‘우리는 함께 연습하기를 약속했다.’에서 ‘함께 연습하기’의 역할은 무엇일까요?",
      options: [
        { id: "noun", label: "목적어 역할을 하는 명사절" },
        { id: "adnominal", label: "명사를 꾸미는 관형절" },
        { id: "adverbial", label: "서술어를 꾸미는 부사절" }
      ],
      answer: "noun",
      feedback: "‘함께 연습하기’ 뒤에 목적격 조사 ‘를’이 붙어 ‘약속했다’의 목적어 역할을 해요.",
      reflection: "이 내용을 관형절을 활용한 문장으로 바꾸면 무엇을 꾸밀 수 있을까요?"
    }
  },
  {
    id: "grammar-meaning-change",
    step: 4,
    title: "문법 요소는 의미와 태도를 어떻게 바꿀까?",
    summary: "시간·높임·피동과 사동·부정 표현을 선택하면 같은 기본 사태도 시간, 참여자의 관계, 초점, 가능성을 다르게 드러낼 수 있어요.",
    inquiryQuestion: "기본 문장에 문법 요소를 바꿔 넣을 때 무엇이 달라지고 무엇은 유지될까요?",
    examples: [
      { sentence: "학생이 문을 연다. / 열었다. / 열 것이다.", note: "현재·과거·미래 시제로 사건시의 위치를 달리 표현함" },
      { sentence: "선생님이 교실에 있다. / 선생님께서 교실에 계신다.", note: "조사·선어말 어미·특수 어휘로 주체를 높임" },
      { sentence: "학생이 문을 열었다. / 문이 학생에게 열렸다.", note: "능동과 피동을 바꾸어 행위자와 영향을 받은 대상의 초점을 달리함" },
      { sentence: "아이가 책을 읽는다. / 어머니가 아이에게 책을 읽게 한다.", note: "주동과 사동을 바꾸어 동작을 시키는 주체를 새로 드러냄" },
      { sentence: "나는 발표한다. / 나는 발표하지 않는다. / 나는 발표하지 못한다.", note: "의지 부정과 능력·상황 부정의 차이를 드러냄" }
    ],
    keyPoints: [
      "시제는 사건시와 발화시의 관계를, 상은 동작이 진행되거나 완료되는 모습을 나타내요.",
      "높임 표현은 청자·주체·객체 가운데 누구를 높이는지와 담화 관계를 드러내요.",
      "피동은 영향을 받은 대상에, 사동은 동작을 시키는 주체에 초점을 옮길 수 있어요.",
      "‘안/-지 않다’와 ‘못/-지 못하다’는 각각 의지 부정과 능력·상황 부정을 나타낼 수 있어요."
    ],
    check: {
      prompt: "‘민지는 수영하지 못했다.’가 가장 잘 드러내는 의미는 무엇일까요?",
      options: [
        { id: "ability", label: "능력이나 상황 때문에 수영할 수 없었음" },
        { id: "choice", label: "스스로 원하지 않아 수영하지 않았음" },
        { id: "honor", label: "수영하는 대상을 높였음" }
      ],
      answer: "ability",
      feedback: "‘못/-지 못하다’는 능력이 없거나 상황이 허락하지 않는 부정을 주로 나타내요.",
      reflection: "의지에 따른 부정으로 바꾸고 두 문장의 차이를 설명해 보세요."
    }
  },
  {
    id: "grammar-synthesis",
    step: 5,
    title: "상황에 맞는 구조와 문법 요소를 어떻게 고를까?",
    summary: "글의 목적·독자·상황을 먼저 살핀 뒤 문장 구조와 문법 요소를 함께 선택하고, 그 효과를 근거로 설명해요.",
    inquiryQuestion: "같은 사건을 친구 대화, 학교 안내, 기사에 쓸 때 어떤 표현을 다르게 선택해야 할까요?",
    examples: [
      { sentence: "창문 좀 닫아 줘.", note: "친한 친구에게 부탁하는 비격식 표현" },
      { sentence: "창문을 닫아 주시기 바랍니다.", note: "공적인 안내에서 청자를 고려한 높임과 종결 표현" },
      { sentence: "안전 점검을 위해 창문이 닫혔다.", note: "결과와 대상에 초점을 둔 피동 표현" }
    ],
    keyPoints: [
      "표현을 만들기 전에 누가 누구에게 어떤 목적으로 말하는지 확인해요.",
      "구조는 정보 사이의 관계를, 문법 요소는 시간·태도·초점·상호 관계를 조절해요.",
      "고쳐 쓴 뒤에는 바꾼 형태만 나열하지 말고 의미와 효과가 어떻게 달라졌는지 설명해요."
    ],
    check: {
      prompt: "학생 대상 공식 안내에 가장 알맞은 문장을 골라 보세요.",
      options: [
        { id: "official", label: "비가 오면 행사는 체육관에서 진행됩니다." },
        { id: "casual", label: "비 오면 체육관에서 할게!" },
        { id: "unclear", label: "행사가 그렇게 될 수도 있다." }
      ],
      answer: "official",
      feedback: "조건을 분명히 밝히고 공적인 상황에 맞는 종결 표현을 사용했어요.",
      reflection: "친구 한 명에게 알려 주는 말이라면 어떤 부분을 바꾸겠나요?"
    }
  }
];

export function evaluateGrammarConceptCheck(lessonId: string, optionId: string) {
  const lesson = grammarElementLessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  return {
    correct: lesson.check.answer === optionId,
    feedback: lesson.check.feedback,
    reflection: lesson.check.reflection
  };
}
