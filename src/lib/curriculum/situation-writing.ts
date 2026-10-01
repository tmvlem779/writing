export type SituationSceneId = "rainy-gate" | "library-help" | "group-presentation";

export type SituationScene = {
  id: SituationSceneId;
  order: number;
  title: string;
  setting: string;
  illustrationLabel: string;
  observations: string[];
  firstCondition: string;
  wordHints: string[];
  focusConcepts: string[];
};

export const situationScenes: SituationScene[] = [
  {
    id: "rainy-gate",
    order: 1,
    title: "비 오는 등굣길",
    setting: "학교 정문 앞에서 한 학생이 우산이 없는 친구에게 다가가는 상황",
    illustrationLabel: "비가 내리는 학교 정문 앞에서 두 학생이 우산을 함께 쓰려는 모습",
    observations: ["비가 내리고 있어요.", "한 학생은 우산이 없어요.", "다른 학생이 우산을 기울여 줘요."],
    firstCondition: "그림에서 확인한 두 가지 사실을 원인·결과 또는 시간 관계가 드러나는 한 문장으로 써 보세요.",
    wordHints: ["비가 내리다", "우산을 함께 쓰다", "다가가다"],
    focusConcepts: ["이어진문장", "원인·결과", "시간 관계"]
  },
  {
    id: "library-help",
    order: 2,
    title: "도서관에서 도움받기",
    setting: "학생이 찾는 책의 제목을 사서 선생님께 말하고 안내받는 상황",
    illustrationLabel: "책장이 있는 도서관에서 학생이 사서 선생님께 책을 문의하는 모습",
    observations: ["학생이 책 제목을 보여 줘요.", "사서 선생님이 높은 책장을 가리켜요.", "학생이 안내를 듣고 있어요."],
    firstCondition: "누가 누구에게 무엇을 묻는지 드러나도록 높임 표현을 사용한 한 문장을 써 보세요.",
    wordHints: ["책을 찾다", "여쭈다", "알려 주시다"],
    focusConcepts: ["높임 표현", "문장 성분", "담화 상황"]
  },
  {
    id: "group-presentation",
    order: 3,
    title: "모둠 발표 준비",
    setting: "발표 시간이 다가오는데 한 학생은 자료를 정리하고 다른 학생은 화면을 만드는 상황",
    illustrationLabel: "시계가 보이는 교실에서 두 학생이 노트와 노트북으로 발표를 준비하는 모습",
    observations: ["발표 시간이 다가와요.", "한 학생은 자료를 정리해요.", "다른 학생은 발표 화면을 만들어요."],
    firstCondition: "두 학생의 행동과 발표 상황을 나열·대조·조건 중 하나의 관계로 연결해 한 문장으로 써 보세요.",
    wordHints: ["자료를 정리하다", "화면을 만들다", "시간이 다가오다"],
    focusConcepts: ["이어진문장", "의미 관계", "정보 초점"]
  }
];

export function getSituationScene(id: SituationSceneId) {
  return situationScenes.find((scene) => scene.id === id) ?? situationScenes[0];
}
