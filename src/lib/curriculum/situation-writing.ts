export type SituationSceneId = "rainy-gate" | "library-help" | "group-presentation";

export type SituationScene = {
  id: SituationSceneId;
  order: number;
  title: string;
  setting: string;
  firstCondition: string;
  wordHints: string[];
  focusConcepts: string[];
};

export const situationScenes: SituationScene[] = [
  {
    id: "rainy-gate",
    order: 1,
    title: "비 오는 등굣길",
    setting: "비 오는 등굣길에 두 학생이 학교 정문 앞에서 만났습니다.",
    firstCondition: "두 학생에게 일어날 일을 상상해 원인·결과 또는 시간 관계가 드러나는 한 문장으로 써 보세요.",
    wordHints: ["비가 내리다", "우산을 함께 쓰다", "다가가다"],
    focusConcepts: ["이어진문장", "원인·결과", "시간 관계"]
  },
  {
    id: "library-help",
    order: 2,
    title: "도서관에서 도움받기",
    setting: "도서관에서 학생이 사서 선생님께 도움을 구합니다.",
    firstCondition: "학생이 무엇을 묻고 어떤 도움을 받았는지 상상해 높임 표현을 사용한 한 문장을 써 보세요.",
    wordHints: ["책을 찾다", "여쭈다", "알려 주시다"],
    focusConcepts: ["높임 표현", "문장 성분", "담화 상황"]
  },
  {
    id: "group-presentation",
    order: 3,
    title: "모둠 발표 준비",
    setting: "발표를 앞둔 교실에서 두 학생이 함께 준비하고 있습니다.",
    firstCondition: "두 학생이 할 일을 상상해 나열·대조·조건 중 하나의 관계로 연결한 한 문장으로 써 보세요.",
    wordHints: ["자료를 정리하다", "화면을 만들다", "시간이 다가오다"],
    focusConcepts: ["이어진문장", "의미 관계", "정보 초점"]
  }
];

export function getSituationScene(id: SituationSceneId) {
  return situationScenes.find((scene) => scene.id === id) ?? situationScenes[0];
}
