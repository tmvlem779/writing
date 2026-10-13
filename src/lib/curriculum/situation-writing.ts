export type SituationSceneId = "rainy-gate" | "library-help" | "group-presentation";

export type SituationScene = {
  id: SituationSceneId;
  order: number;
  title: string;
  setting: string;
  firstCondition: string;
  focusConcepts: string[];
};

export const sentenceBuildingQuestions = [
  "상황에 맞게 주어와 서술어가 드러나는 짧은 문장을 써 보세요.",
  "앞 문장에 언제·어디서·무엇을·어떻게 중 하나를 나타내는 부속 성분을 더해 다시 써 보세요.",
  "앞 문장에 새로운 행동이나 상태를 나타내는 절을 하나 더하고 연결 표현을 사용해 한 문장으로 써 보세요.",
  "완성한 긴 문장의 주어·서술어 호응과 상황 적절성을 점검하고, 필요한 곳을 고쳐 최종 문장을 써 보세요."
] as const;

export const situationScenes: SituationScene[] = [
  {
    id: "rainy-gate",
    order: 1,
    title: "비 오는 등굣길",
    setting: "비 오는 등굣길에 두 학생이 학교 정문 앞에서 만났습니다.",
    firstCondition: sentenceBuildingQuestions[0],
    focusConcepts: ["이어진문장", "원인·결과", "시간 관계"]
  },
  {
    id: "library-help",
    order: 2,
    title: "도서관에서 도움받기",
    setting: "도서관에서 학생이 사서 선생님께 도움을 구합니다.",
    firstCondition: sentenceBuildingQuestions[0],
    focusConcepts: ["높임 표현", "문장 성분", "담화 상황"]
  },
  {
    id: "group-presentation",
    order: 3,
    title: "모둠 발표 준비",
    setting: "발표를 앞둔 교실에서 두 학생이 함께 준비하고 있습니다.",
    firstCondition: sentenceBuildingQuestions[0],
    focusConcepts: ["이어진문장", "의미 관계", "정보 초점"]
  }
];

export function getSituationScene(id: SituationSceneId) {
  return situationScenes.find((scene) => scene.id === id) ?? situationScenes[0];
}
