export type RealLifeMaterialKind = "article" | "notice" | "dialogue" | "presentation" | "interview" | "social";

export type RealLifeMaterial = {
  id: RealLifeMaterialKind;
  order: number;
  label: string;
  title: string;
  situation: string;
  content: string;
  focusConcepts: string[];
  analysisPrompts: string[];
  rewritePrompt: string;
  sourceNote: "수업용 재구성 자료";
};

export type RealLifePracticeMode = "structure" | "effect" | "rewrite";

export const realLifePracticeModes: Array<{
  id: RealLifePracticeMode;
  label: string;
  description: string;
}> = [
  { id: "structure", label: "구조 찾기", description: "절의 경계와 문장 구조를 찾아 근거를 설명해요." },
  { id: "effect", label: "효과 설명", description: "구조가 정보 관계와 강조점에 미친 영향을 살펴요." },
  { id: "rewrite", label: "고쳐 쓰기", description: "자료의 목적과 독자를 고려해 문장을 직접 바꿔 써요." }
];

export const realLifeMaterials: RealLifeMaterial[] = [
  {
    id: "article",
    order: 1,
    label: "기사",
    title: "점심시간 도서관 이용 늘어",
    situation: "학교 소식을 전하는 짧은 기사",
    content: "학생 자치회가 이용 시간을 조사한 결과, 점심시간에 도서관을 찾는 학생이 지난달보다 늘었다. 도서관은 자리가 부족해지자 빈 교실에 임시 열람 공간을 마련했고, 학생들은 조용히 공부할 곳이 늘어서 좋다는 반응을 보였다.",
    focusConcepts: ["종속적으로 이어진문장", "관형절", "인용절"],
    analysisPrompts: [
      "원인과 결과를 이어 주는 절을 찾아보세요.",
      "기사에서 배경 정보로 제시된 관형절이나 인용절은 무엇인가요?"
    ],
    rewritePrompt: "핵심 사실이 먼저 드러나도록 첫 문장을 고쳐 쓰고, 그렇게 바꾼 이유를 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "notice",
    order: 2,
    label: "안내문",
    title: "체육관 이용 안내",
    situation: "학생에게 행동과 조건을 분명히 알려야 하는 안내문",
    content: "체육관 바닥 공사를 진행하므로 이번 주 수요일에는 체육관을 이용할 수 없습니다. 체육 수업을 듣는 학생은 운동장으로 이동하고, 비가 오면 각 반 교실에서 대체 활동을 합니다. 안전을 위해 공사 구역에는 들어가지 마세요.",
    focusConcepts: ["원인 관계", "조건 관계", "명령 표현"],
    analysisPrompts: [
      "이용할 수 없는 이유와 대체 행동이 어떤 구조로 연결되어 있나요?",
      "조건을 나타내는 앞절이 빠지면 안내의 의미가 어떻게 달라질까요?"
    ],
    rewritePrompt: "학생이 날짜·장소·행동을 더 빨리 파악하도록 안내문을 세 문장 이내로 고쳐 써 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "dialogue",
    order: 3,
    label: "대화",
    title: "모둠 발표를 준비하며",
    situation: "친구들이 역할을 조정하는 대화",
    content: "서윤: 자료 조사는 끝났지만 발표 화면은 아직 만들지 못했어.\n도현: 내가 사진을 정리할 테니 네가 핵심 문장을 골라 줄래?\n서윤: 좋아. 자료가 너무 많아서 무엇을 남길지 고민됐는데, 기준이 생기면 고르기 쉬울 것 같아.",
    focusConcepts: ["대조 관계", "의도 관계", "인용과 말하기 맥락"],
    analysisPrompts: [
      "‘-지만’, ‘-ㄹ 테니’, ‘-면’이 각각 어떤 관계를 드러내나요?",
      "대화 참여자의 요청과 응답이 문장 구조에 어떻게 나타나나요?"
    ],
    rewritePrompt: "서윤의 마지막 말을 발표 준비 상황에 더 간결하게 어울리도록 고쳐 쓰고, 남긴 정보와 뺀 정보를 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "presentation",
    order: 4,
    label: "발표",
    title: "학교 숲이 필요한 이유",
    situation: "친구들 앞에서 주장을 설명하는 발표 일부",
    content: "학교에 나무가 많으면 여름철 그늘이 생겨서 학생들이 더 편하게 쉴 수 있습니다. 잎이 넓은 나무는 운동장에서 생기는 열을 줄이는 데에도 도움이 됩니다. 따라서 우리는 비어 있는 화단에 나무를 심는 방안을 함께 검토해야 합니다.",
    focusConcepts: ["조건 관계", "원인·결과", "주장과 근거"],
    analysisPrompts: [
      "조건, 근거, 주장을 나타내는 문장을 각각 구분해 보세요.",
      "이어진문장이 청중의 이해를 돕는 부분은 어디인가요?"
    ],
    rewritePrompt: "첫 문장을 두 개의 홑문장으로 바꾼 뒤, 발표에서 어느 구조가 더 효과적인지 비교해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "interview",
    order: 5,
    label: "인터뷰",
    title: "도서 정리 봉사를 마치고",
    situation: "학교 방송반이 봉사 참여 학생에게 묻는 인터뷰",
    content: "진행자: 도서 정리 봉사에서 가장 어려웠던 점은 무엇이었나요?\n학생: 처음에는 책의 분류 기호를 찾는 일이 어려웠습니다. 하지만 담당 선생님께서 분류 기준을 설명해 주셔서 책을 제자리에 놓을 수 있었습니다. 다음에도 참여하고 싶습니다.",
    focusConcepts: ["의문문", "종속적으로 이어진문장", "직접·간접 인용"],
    analysisPrompts: [
      "학생의 경험에서 어려움과 해결 과정은 어떤 관계로 연결되나요?",
      "학생의 답을 기사에 옮길 때 직접 인용과 간접 인용 중 무엇을 선택하겠나요?"
    ],
    rewritePrompt: "학생의 답을 간접 인용 표현이 들어간 기사 문장으로 바꾸고, 시점이나 종결 표현이 어떻게 달라졌는지 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "social",
    order: 6,
    label: "학습자 SNS",
    title: "과학 동아리 체험 모집",
    situation: "학교 안에서 공유하는 동아리 홍보 게시물",
    content: "이번 금요일 방과 후, 과학실에서 미니 로켓을 만들어요! 준비물은 필요 없고 친구와 함께 와도 됩니다. 자리가 열다섯 개뿐이어서 참여하고 싶다면 목요일까지 신청해 주세요. 궁금한 점은 댓글로 남겨 주세요.",
    focusConcepts: ["나열 관계", "원인 관계", "독자 행동 유도"],
    analysisPrompts: [
      "게시물이 제공하는 정보와 요청하는 행동을 나누어 보세요.",
      "친근한 느낌과 긴급함을 만드는 문장 구조는 무엇인가요?"
    ],
    rewritePrompt: "같은 내용을 학교 공식 알림에 올린다고 생각하고, 문장 구조와 종결 표현을 바꾸어 써 보세요.",
    sourceNote: "수업용 재구성 자료"
  }
];

export function buildRealLifeTask(material: RealLifeMaterial, mode: RealLifePracticeMode) {
  if (mode === "structure") return material.analysisPrompts[0];
  if (mode === "effect") return material.analysisPrompts[1];
  return material.rewritePrompt;
}
