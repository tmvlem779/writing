import type { Activity } from "@/lib/agent/schema";
import type { ConceptLesson } from "@/lib/curriculum/sentence-structure";
import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";

export type CourseLessonNumber = 1 | 2 | 3 | 4 | 5;

export type CoursePracticeActivity = {
  id: string;
  activity: Activity;
  label: string;
  prompt: string;
};

export type CourseLesson = {
  number: CourseLessonNumber;
  title: string;
  keyQuestion: string;
  activities: string[];
  conceptLessonId: ConceptLesson["id"];
  practiceActivities: CoursePracticeActivity[];
  realLifeMaterialIds: RealLifeMaterialKind[];
};

export const fiveLessonCourse: CourseLesson[] = [
  {
    number: 1,
    title: "문장의 짜임과 홑문장·겹문장",
    keyQuestion: "문장의 구조는 어떻게 파악할 수 있을까?",
    activities: ["문장 성분 복습", "주어·서술어 관계 찾기", "홑문장·겹문장 구별", "문장 구조 진단"],
    conceptLessonId: "sentence-and-clause",
    practiceActivities: [
      { id: "components", activity: "diagnose", label: "문장 성분 복습", prompt: "‘학생들이 운동장에서 공을 찬다.’에서 주어와 서술어를 찾고, 그렇게 판단한 근거를 적어 보세요." },
      { id: "predicate-pairs", activity: "diagnose", label: "관계 찾기", prompt: "‘종이 울리자 학생들이 교실로 들어갔다.’에서 주어·서술어 관계를 모두 찾아 짝지어 보세요." },
      { id: "simple-complex", activity: "compare", label: "홑문장·겹문장", prompt: "‘바람이 분다.’와 ‘바람이 불어서 나뭇잎이 흔들린다.’의 구조를 비교하고 구별 근거를 설명해 보세요." },
      { id: "structure-diagnosis", activity: "reflect", label: "구조 진단", prompt: "홑문장 하나와 겹문장 하나를 직접 만든 뒤, 각 문장의 주어·서술어 관계 수를 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 2,
    title: "이어진문장",
    keyQuestion: "문장과 문장은 어떻게 연결되는가?",
    activities: ["대등·종속 연결 분석", "연결 관계 파악", "두 홑문장 결합", "표현 효과 비교"],
    conceptLessonId: "connected-sentences",
    practiceActivities: [
      { id: "connection-analysis", activity: "diagnose", label: "연결 분석", prompt: "‘비가 그쳤고 구름이 걷혔다.’와 ‘비가 그쳐서 경기가 시작되었다.’에서 절의 관계가 어떻게 다른지 설명해 보세요." },
      { id: "meaning-relation", activity: "compare", label: "관계 파악", prompt: "나열·대조·원인·조건 가운데 두 가지를 골라 각각 알맞은 연결 어미와 그 의미 관계를 적어 보세요." },
      { id: "combine-clauses", activity: "expand", label: "문장 결합", prompt: "‘기온이 내려갔다. 길이 얼었다.’를 서로 다른 연결 관계가 드러나는 두 문장으로 결합해 보세요." },
      { id: "connection-effect", activity: "reflect", label: "효과 설명", prompt: "방금 만든 두 문장을 비교하여 독자가 사건의 관계를 어떻게 다르게 이해하는지 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 3,
    title: "안은문장 ①",
    keyQuestion: "하나의 문장이 어떻게 다른 문장의 성분이 되는가?",
    activities: ["명사절·관형절·부사절 분석", "안긴문장 역할 파악", "문장 결합", "문장 변형"],
    conceptLessonId: "embedded-basic",
    practiceActivities: [
      { id: "embedded-boundary", activity: "diagnose", label: "안긴절 찾기", prompt: "‘친구가 추천한 책을 읽었다.’에서 안긴절의 경계를 표시하고 안긴절 안의 주어와 서술어를 찾아보세요." },
      { id: "embedded-role", activity: "compare", label: "역할 파악", prompt: "명사절·관형절·부사절이 문장 안에서 각각 어떤 문장 성분처럼 기능하는지 예와 함께 설명해 보세요." },
      { id: "embed-sentences", activity: "expand", label: "문장 결합", prompt: "‘친구가 약속을 지켰다. 나는 그 사실을 안다.’를 명사절을 안은 한 문장으로 결합해 보세요." },
      { id: "transform-embedded", activity: "create", label: "문장 변형", prompt: "‘도서관에서 책을 빌렸다.’를 바탕으로 관형절을 안은 문장과 부사절을 안은 문장을 각각 만들어 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 4,
    title: "안은문장 ②와 문장 구조·의미",
    keyQuestion: "복잡한 문장 구조는 의미와 어떤 관계가 있을까?",
    activities: ["서술절·인용절 분석", "여러 안긴문장 비교", "의미 차이·중의성 분석", "문장 고쳐쓰기"],
    conceptLessonId: "embedded-advanced-effect",
    practiceActivities: [
      { id: "predicate-quotation", activity: "diagnose", label: "서술절·인용절", prompt: "‘우리 반은 분위기가 밝다.’와 ‘민지는 내일 출발하겠다고 말했다.’에서 안긴절의 경계와 역할을 설명해 보세요." },
      { id: "embedded-comparison", activity: "compare", label: "구조 비교", prompt: "같은 내용을 관형절과 인용절을 활용해 각각 표현하고, 강조되는 정보가 어떻게 달라지는지 비교해 보세요." },
      { id: "ambiguity", activity: "error", label: "중의성 탐구", prompt: "‘나는 어제 온 친구의 동생을 만났다.’가 두 가지로 이해될 수 있는 이유를 구조의 관점에서 설명해 보세요." },
      { id: "clarify-meaning", activity: "error", label: "문장 고쳐쓰기", prompt: "앞 문장이 한 가지 뜻으로만 이해되도록 직접 고쳐 쓰고, 어떤 구조를 바꾸었는지 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 5,
    title: "문장 생성과 종합 활동",
    keyQuestion: "내가 의도한 의미를 문장 구조로 표현할 수 있을까?",
    activities: ["조건에 맞는 문장 생성", "구조 분석", "자기 설명", "상호 피드백", "종합 평가"],
    conceptLessonId: "synthesis-generation",
    practiceActivities: [
      { id: "conditioned-writing", activity: "create", label: "조건 문장 생성", prompt: "학교생활을 주제로 홑문장, 이어진문장, 안은문장을 각각 하나씩 만들되 세 문장이 같은 핵심 내용을 담도록 해 보세요." },
      { id: "self-analysis", activity: "compare", label: "구조 분석", prompt: "내가 만든 세 문장에서 절의 경계와 주어·서술어 관계를 표시하고 각 구조의 이름을 적어 보세요." },
      { id: "self-explanation", activity: "reflect", label: "자기 설명", prompt: "세 문장 가운데 의도한 의미를 가장 잘 표현한 문장을 고르고, 구조와 표현 효과를 근거로 이유를 설명해 보세요." },
      { id: "peer-feedback", activity: "error", label: "상호 피드백", prompt: "친구에게 보여 줄 문장 하나와 ‘구조가 분명한가, 의도한 의미가 드러나는가’ 중 받고 싶은 피드백 기준을 적어 보세요. 친구의 의견을 받은 뒤에는 수정 여부를 스스로 결정하세요." },
      { id: "final-performance", activity: "transfer", label: "종합 평가", prompt: "학교생활의 문제나 제안을 주제로 3~5문장을 쓰고, 사용한 문장 구조 두 가지와 그 구조를 선택한 이유를 덧붙여 보세요." }
    ],
    realLifeMaterialIds: ["article", "notice", "dialogue", "presentation", "interview", "social"]
  }
];

export function getCourseLesson(number: CourseLessonNumber) {
  return fiveLessonCourse.find((lesson) => lesson.number === number) ?? fiveLessonCourse[0];
}
