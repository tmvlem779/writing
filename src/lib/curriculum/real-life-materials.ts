import type { CourseLessonNumber, CourseTrackId } from "@/lib/curriculum/five-lesson-course";

export type RealLifeMaterialKind =
  | "article"
  | "notice"
  | "dialogue"
  | "presentation"
  | "interview"
  | "social"
  | "literature"
  | "literature-sanyuhwa"
  | "literature-dongbaek"
  | "literature-unsu";

export type RealLifeMaterialGroup = "all" | "literature" | "authentic";

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
  selectableSentences?: string[];
  genre?: "시" | "소설";
  author?: string;
  sourceNote:
    | "수업용 재구성 자료"
    | "저작권 보호기간 만료 작품 · 전문"
    | "저작권 보호기간 만료 작품 · 확대 발췌";
};

export type RealLifePracticeMode = "structure" | "effect" | "rewrite";

export type RealLifeLessonGuide = {
  lessonNumber: CourseLessonNumber;
  materialIds: RealLifeMaterialKind[];
  focusConcepts: string[];
  reviewPrompts: string[];
  analysisPrompts: [string, string];
  rewritePrompt: string;
};

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

const jindallaekkotSentences = [
  "나 보기가 역겨워\n가실 때에는\n말없이 고이 보내드리오리다.",
  "영변(寧邊)에 약산(藥山)\n진달래꽃\n아름따다 가실 길에 뿌리오리다.",
  "가시는 걸음 걸음\n놓인 그 꽃을\n사뿐히 즈려밟고 가시옵소서.",
  "나 보기가 역겨워\n가실 때에는\n죽어도 아니 눈물 흘리오리다."
];

const sanyuhwaSentences = [
  "산에는 꽃 피네\n꽃이 피네\n갈 봄 여름없이\n꽃이 피네",
  "산에\n산에\n피는 꽃은\n저만치 혼자서 피어 있네",
  "산에서 우는 작은 새요\n꽃이 좋아\n산에서\n사노라네",
  "산에는 꽃 지네\n꽃이 지네\n갈 봄 여름없이\n꽃이 지네"
];

const dongbaekkotSentences = [
  "오늘도 또 우리 수탉이 막 쫓기었다.",
  "내가 점심을 먹고 나무를 하러 갈 양으로 나올 때이었다.",
  "산으로 올라서려니까 등뒤에서 푸드득푸드득, 하고 닭의 횃소리가 야단이다.",
  "깜짝 놀라서 고개를 돌려보니 아니나다르랴, 두 놈이 또 얼리었다.",
  "점순네 수탉(은 대강이가 크고 똑 오소리같이 실팍하게 생긴 놈)이 덩저리 작은 우리 수탉을 함부로 해내는 것이다.",
  "그것도 그냥 해내는 것이 아니라 푸드득하고 면두를 쪼고 물러섰다가 좀 사이를 두고 푸드득하고 모가지를 쪼았다.",
  "이렇게 멋을 부려 가며 여지없이 닦아 놓는다.",
  "그러면 이 못생긴 것은 쪼일 적마다 주둥이로 땅을 받으며 그 비명이 킥, 킥, 할 뿐이다.",
  "물론 미처 아물지도 않은 면두를 또 쪼이며 붉은 선혈은 뚝뚝 떨어진다.",
  "이걸 가만히 내려다보자니 내 대강이가 터져서 피가 흐르는 것같이 두 눈에서 불이 번쩍 난다.",
  "대뜸 지게막대기를 메고 달려들어 점순네 닭을 후려칠까 하다가 생각을 고쳐먹고 헛매질로 떼어만 놓았다."
];

const unsuSentences = [
  "새침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 비가 추적추적 내리었다.",
  "이날이야말로 동소문 안에서 인력거꾼 노릇을 하는 김 첨지에게는 오래간만에도 닥친 운수 좋은 날이었다.",
  "문안에 들어간답시는 앞집 마나님을 전찻길까지 모셔다 드린 것을 비롯으로 행여나 손님이 있을까 하고 정류장에서 어정어정하며 내리는 사람 하나하나에게 거의 비는 듯한 눈결을 보내고 있다가 마침내 교원인 듯한 양복장이를 동광학교까지 태워다 주기로 되었다.",
  "첫번에 삼십 전, 둘째 번에 오십 전―아침 댓바람에 그리 흔치 않은 일이었다.",
  "그야말로 재수가 옴붙어서 근 열흘 동안 돈 구경도 못한 김 첨지는 십 전짜리 백통화 서 푼, 또는 다섯 푼이 찰깍하고 손바닥에 떨어질 제 거의 눈물을 흘릴 만큼 기뻤었다.",
  "더구나 이날 이때에 이 팔십 전이라는 돈이 그에게 얼마나 유용한지 몰랐다.",
  "컬컬한 목에 모주 한 잔도 적실 수 있거니와 그보다도 앓는 아내에게 설렁탕 한 그릇도 사다줄 수 있음이다.",
  "그의 아내가 기침으로 쿨럭거리기는 벌써 달포가 넘었다.",
  "조밥도 굶기를 먹다시피 하는 형편이니 물론 약 한 첩 써 본 일이 없다.",
  "구태여 쓰려면 못 쓸 바도 아니로되 그는 병이란 놈에게 약을 주어 보내면 재미를 붙여서 자꾸 온다는 자기의 신조에 어디까지 충실하였다."
];

export const grammarRealLifeMaterials: RealLifeMaterial[] = [
  {
    id: "article",
    order: 1,
    label: "기사",
    title: "통학로 안전 시설 보강돼",
    situation: "사건의 시간과 정보의 초점을 조절하는 학교 기사",
    content: "학생회가 지난달 통학로를 조사한 결과, 횡단보도 앞 조명이 어둡다는 의견이 모였다. 학교는 안전 시설이 이번 주에 보강되었다고 밝혔으며, 학생들이 더 안심하고 등교할 수 있을 것으로 내다봤다. 다만 공사가 끝나지 않은 구역은 아직 이용할 수 없다.",
    focusConcepts: ["과거·미래 시제", "피동 표현", "간접 인용", "부정 표현"],
    analysisPrompts: [
      "이미 일어난 일과 앞으로 예상하는 일을 나타낸 표현을 나누어 보세요.",
      "피동과 간접 인용 표현이 기사에서 정보의 초점과 객관적인 느낌에 어떤 영향을 주나요?"
    ],
    rewritePrompt: "행위 주체가 분명해야 할 문장을 하나 골라 능동 표현으로 고쳐 쓰고, 초점이 어떻게 달라졌는지 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "notice",
    order: 2,
    label: "안내문",
    title: "축제 강당 이용 안내",
    situation: "조건과 높임 표현으로 행동을 안내하는 학교 공지",
    content: "축제 리허설이 진행되는 동안에는 강당 출입이 제한됩니다. 참가 학생은 담당 선생님께 출입증을 보여 드린 뒤 입장해 주시기 바랍니다. 출입증이 없으면 들어갈 수 없으니 교실에서 먼저 확인해 주세요.",
    focusConcepts: ["조건 관계", "주체·객체·상대 높임", "피동 표현", "부정 표현"],
    analysisPrompts: [
      "누구를 높이는 표현인지 주체·객체·청자로 나누어 살펴보세요.",
      "피동과 조건·부정 표현이 이용 규칙을 어떻게 분명하게 만드나요?"
    ],
    rewritePrompt: "같은 내용을 친한 친구에게 보내는 메시지로 바꾸고, 높임과 종결 표현을 바꾼 이유를 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "dialogue",
    order: 3,
    label: "대화",
    title: "모둠 영상 제출을 앞두고",
    situation: "시간·부정·사동 표현이 드러나는 친구 대화",
    content: "하린: 나는 자막을 아직 다 넣지 못했어.\n준호: 그럼 내가 배경 음악을 고를게. 편집이 끝나면 나에게 확인하게 해 줘.\n하린: 좋아. 어제는 파일이 열리지 않았지만 지금은 잘 열리고 있어.",
    focusConcepts: ["과거·현재 시제", "진행상", "사동 표현", "못 부정"],
    analysisPrompts: [
      "‘못했어’와 ‘열리지 않았다’가 각각 무엇 때문에 생긴 부정인지 추론해 보세요.",
      "‘확인하게 해 줘’에서 동작을 하는 사람과 시키는 사람은 누구인가요?"
    ],
    rewritePrompt: "대화의 핵심 내용을 담당 교사에게 보고하는 두 문장으로 바꾸고, 시간·높임·인용 표현의 변화를 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "presentation",
    order: 4,
    label: "발표",
    title: "일회용품을 줄이는 교실",
    situation: "구조와 문법 요소로 근거와 제안을 전달하는 발표",
    content: "우리 반에서 일주일 동안 버려진 종이컵은 모두 여든 개였습니다. 개인 컵을 사용하면 쓰레기를 줄일 수 있고 물건을 오래 쓰는 습관도 기를 수 있습니다. 그래서 다음 달에는 개인 컵 사용 주간을 운영해 보려고 합니다.",
    focusConcepts: ["피동 표현", "조건 관계", "사동 표현", "미래·의도 표현"],
    analysisPrompts: [
      "조사 결과·근거·제안을 나타내는 문장을 구분하고 사용된 구조를 설명해 보세요.",
      "피동·사동·미래 표현이 각각 무엇에 초점을 두는지 살펴보세요."
    ],
    rewritePrompt: "제안의 책임 주체가 더 분명해지도록 한 문장을 고쳐 쓰고, 능동·피동 선택의 효과를 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "interview",
    order: 5,
    label: "인터뷰",
    title: "학교 기록관 선생님을 만나다",
    situation: "높임과 직접·간접 인용을 비교하는 인터뷰",
    content: "진행자: 선생님께서는 오래된 학교 사진을 어떻게 보관하고 계십니까?\n선생님: 사진이 상하지 않도록 온도와 습도를 확인하고 있습니다. 학생들이 기록의 가치를 알게 하는 것도 제 일입니다.\n진행자: 선생님께서는 보관 환경을 매일 살피신다고 말씀하셨습니다.",
    focusConcepts: ["주체 높임", "상대 높임", "진행상", "간접 인용", "사동 표현"],
    analysisPrompts: [
      "조사·선어말 어미·특수 어휘 가운데 어떤 높임 장치가 사용되었나요?",
      "직접 답변이 간접 인용으로 옮겨질 때 종결 표현과 관점이 어떻게 달라졌나요?"
    ],
    rewritePrompt: "선생님의 답변 한 문장을 직접 인용과 간접 인용으로 각각 옮기고 달라진 표현을 표시해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "social",
    order: 6,
    label: "학습자 SNS",
    title: "교내 나눔 장터 후기",
    situation: "친근한 종결과 시간·피동 표현을 사용하는 수업용 게시물",
    content: "오늘 나눔 장터가 드디어 열렸어요! 친구들이 가져온 물건이 새 주인을 만났고, 남은 물건은 복지 기관에 전달될 예정이에요. 저는 판매를 돕느라 공연을 보지 못했지만 다음 행사에도 꼭 참여할 거예요. 여러분은 어떤 물건이 가장 기억에 남았나요?",
    focusConcepts: ["과거·미래 시제", "피동 표현", "못 부정", "의문 종결 표현"],
    analysisPrompts: [
      "지난 경험, 예정된 일, 앞으로의 의지를 나타내는 시간 표현을 나누어 보세요.",
      "피동·부정·의문 표현이 게시물의 초점과 독자 참여에 어떤 효과를 내나요?"
    ],
    rewritePrompt: "같은 내용을 학교 누리집의 공식 기사로 바꾸고, 종결·높임·시간 표현을 왜 바꾸었는지 설명해 보세요.",
    sourceNote: "수업용 재구성 자료"
  },
  {
    id: "literature",
    order: 7,
    label: "문학 작품",
    title: "김소월 〈진달래꽃〉",
    situation: "시의 문장 구조와 문법 요소가 화자의 태도를 드러내는 방식 탐구",
    content: jindallaekkotSentences.join("\n\n"),
    selectableSentences: jindallaekkotSentences,
    focusConcepts: ["높임 표현", "시간 표현", "부정 표현", "종결 표현", "시적 화자의 태도"],
    analysisPrompts: [
      "‘나 보기가’와 ‘가실 때’에서 절의 경계를 찾고, 각 절이 문장 안에서 어떤 역할을 하는지 설명해 보세요.",
      "‘가실’, ‘드리우리다’의 높임·시간·의지 표현이 이별을 대하는 화자의 태도에 어떤 효과를 더하는지 근거를 들어 말해 보세요."
    ],
    rewritePrompt: "세 행의 뜻을 일상적인 산문 두 문장으로 바꾼 뒤, 원문의 구조와 문법 요소를 바꾸면서 정서와 강조점이 어떻게 달라졌는지 설명해 보세요.",
    genre: "시",
    author: "김소월",
    sourceNote: "저작권 보호기간 만료 작품 · 전문"
  },
  {
    id: "literature-sanyuhwa",
    order: 8,
    label: "문학 작품",
    title: "김소월 〈산유화〉",
    situation: "반복과 생략이 시의 호흡과 의미를 만드는 방식 탐구",
    content: sanyuhwaSentences.join("\n\n"),
    selectableSentences: sanyuhwaSentences,
    focusConcepts: ["종결 표현", "시간 표현", "문장 성분의 생략", "반복 표현", "시적 호흡"],
    analysisPrompts: [
      "서로 같은 문장과 달라진 문장을 골라, 성분이 생략되었는지와 홑문장·겹문장 여부를 판단해 보세요.",
      "같은 구조를 반복하면서 리듬과 의미의 강조점이 어떻게 만들어지는지 설명해 보세요."
    ],
    rewritePrompt: "반복을 살린 버전과 반복을 줄인 산문 버전을 각각 쓰고, 호흡과 강조점을 비교해 보세요.",
    genre: "시",
    author: "김소월",
    sourceNote: "저작권 보호기간 만료 작품 · 전문"
  },
  {
    id: "literature-dongbaek",
    order: 9,
    label: "문학 작품",
    title: "김유정 〈동백꽃〉",
    situation: "서술자가 사건을 발견하는 과정에서 문장이 확장되는 방식 탐구",
    content: dongbaekkotSentences.join(" "),
    selectableSentences: dongbaekkotSentences,
    focusConcepts: ["홑문장·겹문장", "관형절", "종속적으로 이어진문장", "시점"],
    analysisPrompts: [
      "사건의 순서를 보여 주는 문장을 고르고, 그 안의 주어·서술어 관계를 세어 구조를 판단해 보세요.",
      "짧은 문장과 긴 문장이 교차하면서 서술자의 놀람과 사건의 속도를 어떻게 드러내는지 설명해 보세요."
    ],
    rewritePrompt: "서술자가 본 사건을 두 개의 홑문장으로 줄였다가 다시 하나의 겹문장으로 합치고, 호흡이 어떻게 달라졌는지 설명해 보세요.",
    genre: "소설",
    author: "김유정",
    sourceNote: "저작권 보호기간 만료 작품 · 확대 발췌"
  },
  {
    id: "literature-unsu",
    order: 10,
    label: "문학 작품",
    title: "현진건 〈운수 좋은 날〉",
    situation: "대화와 서술을 오가는 문장 구조가 인물의 심리를 드러내는 방식 탐구",
    content: unsuSentences.join(" "),
    selectableSentences: unsuSentences,
    focusConcepts: ["인용절", "안은문장", "대화의 홑문장", "반어적 표현"],
    analysisPrompts: [
      "서술 문장과 인물의 말에서 각각 한 문장을 골라, 홑문장·겹문장과 인용절 여부를 판단해 보세요.",
      "‘오늘 운수가 좋았느니’가 단정적인 홑문장으로 표현되었을 때 인물의 마음과 독자의 느낌에 어떤 효과가 생기는지 설명해 보세요."
    ],
    rewritePrompt: "인물의 말을 간접 인용으로 바꾼 뒤, 직접 인용과 비교하여 인물의 목소리와 정보 초점이 어떻게 달라졌는지 설명해 보세요.",
    genre: "소설",
    author: "현진건",
    sourceNote: "저작권 보호기간 만료 작품 · 확대 발췌"
  }
];

export const realLifeLessonGuides: RealLifeLessonGuide[] = [
  {
    lessonNumber: 5,
    materialIds: ["article", "notice", "dialogue", "presentation", "interview", "social"],
    focusConcepts: ["홑문장·겹문장", "이어진문장", "안은문장", "목적과 독자", "표현 효과"],
    reviewPrompts: [
      "1차시: 주어·서술어 관계의 수를 세어 홑문장과 겹문장을 구별해 보세요.",
      "2차시: 이어진문장의 연결 어미와 대등·종속 관계를 찾아보세요.",
      "3차시: 명사절·관형절·부사절의 경계와 문장 안 역할을 찾아보세요.",
      "4차시: 서술절·인용절 또는 중의성이 나타나는 부분을 살펴보세요."
    ],
    analysisPrompts: [
      "자료에서 홑문장·이어진문장·안은문장을 찾아 구조를 분석하고, 자료의 목적에 가장 기여하는 문장을 하나 고르세요.",
      "고른 문장이 자료의 독자에게 의도한 의미를 효과적으로 전달하는지 구조와 표현 효과를 근거로 평가해 보세요."
    ],
    rewritePrompt: "같은 내용을 다른 형식의 실생활 글로 바꾸어 3~5문장을 쓰고, 사용한 문장 구조 두 가지와 선택 이유를 설명해 보세요."
  }
];

export const grammarRealLifeLessonGuide: RealLifeLessonGuide = {
  lessonNumber: 6,
  materialIds: [
    "article",
    "notice",
    "dialogue",
    "presentation",
    "interview",
    "social",
    "literature",
    "literature-sanyuhwa",
    "literature-dongbaek",
    "literature-unsu"
  ],
  focusConcepts: ["문장 구조", "종결 표현", "높임 표현", "시간 표현", "피동·사동", "부정 표현", "인용 표현", "담화 맥락"],
  reviewPrompts: [
    "1차시: 문장 성분과 주어·서술어 관계를 찾아 기본 구조를 설명해 보세요.",
    "2차시: 연결 어미가 나타내는 나열·대조·원인·조건 등의 관계를 찾아보세요.",
    "3차시: 명사절·관형절·부사절의 경계와 문장 안 역할을 찾아보세요.",
    "4차시: 종결·높임·시간 표현이 화자의 태도, 인물 관계, 사건의 시점을 어떻게 드러내는지 살펴보세요.",
    "5차시: 피동·사동·부정·인용 표현이 행위의 주체, 정보 초점, 관점에 어떤 변화를 주는지 살펴보세요."
  ],
  analysisPrompts: [
    "자료에서 문장 구조와 문법 요소를 각각 찾아 형태와 역할을 분석하고, 화자·독자·목적을 정리하세요.",
    "찾은 표현이 시간, 인물 관계, 정보 초점, 화자의 태도를 어떻게 드러내는지 근거를 들어 평가하세요."
  ],
  rewritePrompt: "같은 내용을 다른 화자·독자·목적에 맞게 3~5문장으로 바꾸고, 사용한 문장 구조 하나와 문법 요소 두 가지의 선택 이유를 설명해 보세요."
};

export function getRealLifeLessonGuide(trackId: CourseTrackId = "structure") {
  return trackId === "grammar" ? grammarRealLifeLessonGuide : realLifeLessonGuides[0];
}

export function getRealLifeMaterialsForLesson(
  lessonNumber: CourseLessonNumber,
  trackId: CourseTrackId = "structure",
  materialGroup: RealLifeMaterialGroup = "all"
) {
  const guide = getRealLifeLessonGuide(trackId);
  if (lessonNumber !== guide.lessonNumber) return [];
  const materials = trackId === "grammar" ? grammarRealLifeMaterials : realLifeMaterials;
  return guide.materialIds
    .map((id) => materials.find((material) => material.id === id))
    .filter((material): material is RealLifeMaterial => Boolean(material))
    .filter((material) => materialGroup === "all" || getRealLifeMaterialGroup(material) === materialGroup);
}

export function getRealLifeMaterialGroup(material: RealLifeMaterial): Exclude<RealLifeMaterialGroup, "all"> {
  return material.genre ? "literature" : "authentic";
}

export function buildRealLifeTask(material: RealLifeMaterial, mode: RealLifePracticeMode) {
  if (mode === "structure") return material.analysisPrompts[0];
  if (mode === "effect") return material.analysisPrompts[1];
  return material.rewritePrompt;
}
