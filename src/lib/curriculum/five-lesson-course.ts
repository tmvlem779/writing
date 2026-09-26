import type { Activity } from "@/lib/agent/schema";
import type { ConceptLesson } from "@/lib/curriculum/sentence-structure";
import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";

export type CourseLessonNumber = 1 | 2 | 3 | 4 | 5;
export type CourseTrackId = "structure" | "grammar";

export type CourseTrack = {
  id: CourseTrackId;
  optionLabel: string;
  title: string;
  description: string;
  badge: string;
};

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

export const grammarWingActivity = {
  title: "날개 · 실생활 탐구",
  keyQuestion: "구조와 문법 요소를 실제 언어 자료에 어떻게 적용할까?",
  activities: ["자료 맥락 파악", "구조·문법 요소 찾기", "표현 효과 평가", "상황에 맞게 고쳐 쓰기"],
  realLifeMaterialIds: ["article", "notice", "dialogue", "presentation", "interview", "social"] as RealLifeMaterialKind[]
} as const;

export const grammarFiveLessonCourse: CourseLesson[] = [
  {
    number: 1,
    title: "문장의 기본 구조와 문장 생성",
    keyQuestion: "문장 성분을 어떻게 조합해야 뜻이 분명한 홑문장이 될까?",
    activities: ["문장 성분 역할 확인", "성분 카드 조합", "홑문장 생성", "구조 자기 설명"],
    conceptLessonId: "grammar-basic-sentence",
    practiceActivities: [
      { id: "grammar-components", activity: "diagnose", label: "성분 역할 찾기", prompt: "‘학생들이 운동장에서 공을 찬다.’의 문장 성분을 나누고 주어·서술어를 먼저 찾은 근거를 적어 보세요." },
      { id: "grammar-component-cards", activity: "compare", label: "성분 조합", prompt: "‘민지가 / 도서관에서 / 책을 / 읽는다’의 어순을 한 번 바꾸어 보고, 자연스러운 문장을 고른 뒤 각 성분의 역할을 설명해 보세요." },
      { id: "grammar-simple-create", activity: "create", label: "홑문장 만들기", prompt: "학교생활을 주제로 주어·서술어·목적어·부사어가 모두 들어간 홑문장을 직접 만들어 보세요." },
      { id: "grammar-simple-explain", activity: "reflect", label: "구조 설명", prompt: "내가 만든 문장에서 각 문장 성분과 주어·서술어 관계의 수를 표시하고, 왜 홑문장인지 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 2,
    title: "이어진문장과 의미 관계",
    keyQuestion: "두 홑문장을 어떤 관계로 연결하면 의도가 잘 드러날까?",
    activities: ["두 홑문장 분석", "연결 의미 선택", "이어진문장 생성", "관계별 효과 비교"],
    conceptLessonId: "grammar-connected-meaning",
    practiceActivities: [
      { id: "grammar-clause-pairs", activity: "diagnose", label: "두 절 찾기", prompt: "‘비가 그쳤다. 경기가 시작되었다.’에서 각 홑문장의 주어·서술어를 찾고 두 사건 사이에 가능한 관계를 두 가지 적어 보세요." },
      { id: "grammar-connective-choice", activity: "compare", label: "의미 관계 선택", prompt: "나열·대조·원인·조건 가운데 두 관계를 골라 알맞은 연결 어미를 붙이고, 관계가 어떻게 달라지는지 설명해 보세요." },
      { id: "grammar-connected-create", activity: "expand", label: "이어진문장 만들기", prompt: "학교 행사에 관한 두 홑문장을 만든 뒤, 나열·대조·원인·조건 중 하나가 분명히 드러나도록 한 문장으로 연결해 보세요." },
      { id: "grammar-connected-effect", activity: "reflect", label: "효과 비교", prompt: "같은 두 절을 서로 다른 연결 어미로 두 번 결합하고, 독자가 사건 관계를 어떻게 다르게 이해하는지 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 3,
    title: "안은문장과 문장 확대",
    keyQuestion: "짧은 문장을 절로 바꾸어 다른 문장 속에 어떻게 넣을까?",
    activities: ["안긴절 경계 찾기", "절의 역할 확인", "명사·관형·부사절 변형", "확대 효과 설명"],
    conceptLessonId: "grammar-embedded-expansion",
    practiceActivities: [
      { id: "grammar-embedded-boundary", activity: "diagnose", label: "안긴절 찾기", prompt: "‘나는 친구가 약속을 지켰음을 알았다.’에서 안긴절의 경계와 그 안의 주어·서술어를 표시해 보세요." },
      { id: "grammar-embedded-role", activity: "compare", label: "절의 역할", prompt: "‘친구가 고른 책을 읽었다.’와 ‘친구가 듣도록 말했다.’에서 안긴절이 각각 무엇을 꾸미는지 비교해 보세요." },
      { id: "grammar-embedded-transform", activity: "expand", label: "문장 확대", prompt: "‘친구가 발표한다.’를 다른 문장 속 명사절·관형절·부사절로 각각 넣어 세 문장을 만들어 보세요." },
      { id: "grammar-embedded-effect", activity: "reflect", label: "확대 효과", prompt: "만든 세 문장 중 하나를 고르고, 안긴절을 사용하면서 새로 더해지거나 강조된 정보가 무엇인지 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 4,
    title: "문법 요소와 의미 변화",
    keyQuestion: "같은 기본 문장은 문법 요소에 따라 의미와 태도가 어떻게 달라질까?",
    activities: ["시간 표현 변형", "높임 표현 선택", "피동·사동 비교", "부정 의미 구별", "표현 효과 설명"],
    conceptLessonId: "grammar-meaning-change",
    practiceActivities: [
      { id: "grammar-time", activity: "compare", label: "시간 표현", prompt: "‘학생이 운동장을 달린다.’를 과거·미래·진행상·완료상으로 바꾸고, 각 표현이 사건을 바라보는 방식을 비교해 보세요." },
      { id: "grammar-honorific", activity: "create", label: "높임 표현", prompt: "‘선생님이 교실에 있다.’를 주체를 높이는 문장으로 바꾸고, 조사·선어말 어미·특수 어휘 중 무엇을 바꾸었는지 설명해 보세요." },
      { id: "grammar-voice-causative", activity: "compare", label: "피동·사동", prompt: "‘학생이 창문을 열었다.’를 피동문으로, ‘아이가 책을 읽는다.’를 사동문으로 바꾸고 각 문장에서 새로 강조되는 대상을 설명해 보세요." },
      { id: "grammar-negation", activity: "error", label: "부정 표현", prompt: "‘나는 발표하지 않았다.’와 ‘나는 발표하지 못했다.’의 차이를 의지와 능력·상황의 관점에서 설명하고, 각각 어울리는 상황을 만들어 보세요." },
      { id: "grammar-effect-explain", activity: "reflect", label: "의미 변화 설명", prompt: "앞 활동에서 바꾼 문장 하나를 고르고, 기본 문장과 비교해 형태·의미·화자의 태도가 어떻게 달라졌는지 설명해 보세요." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 5,
    title: "구조와 문법 요소의 종합적 활용",
    keyQuestion: "상황에 맞는 구조와 문법 요소로 의도한 의미를 표현할 수 있을까?",
    activities: ["담화 맥락 분석", "조건 문장 생성", "다른 상황으로 변형", "선택 이유 설명", "상호 피드백·종합 평가"],
    conceptLessonId: "grammar-synthesis",
    practiceActivities: [
      { id: "grammar-context", activity: "diagnose", label: "맥락 분석", prompt: "‘창문을 닫아 주세요.’가 사용될 수 있는 화자·청자·목적을 정하고, 같은 요청을 친구와 교장 선생님께 할 때 무엇을 달리해야 하는지 적어 보세요." },
      { id: "grammar-integrated-create", activity: "create", label: "종합 문장 생성", prompt: "학교 행사 안내 상황을 정한 뒤 이어진문장이나 안은문장 하나와 시간·높임·피동/사동·부정 표현 중 두 가지를 사용해 3~5문장을 써 보세요." },
      { id: "grammar-context-transform", activity: "transfer", label: "상황별 변형", prompt: "내 문장 중 하나를 골라 친구 대화용과 학교 공식 안내용으로 각각 바꾸어 쓰고, 바꾼 문법 요소를 표시해 보세요." },
      { id: "grammar-self-explain", activity: "reflect", label: "선택 이유 설명", prompt: "사용한 문장 구조 하나와 문법 요소 두 가지가 의미·정보 초점·화자 태도에 미친 효과를 근거와 함께 설명해 보세요." },
      { id: "grammar-peer-review", activity: "error", label: "상호 피드백·평가", prompt: "친구에게 보여 줄 문장과 ‘상황에 어울리는가, 의도가 분명한가, 선택 이유가 타당한가’ 중 받고 싶은 기준을 정하세요. 의견을 받은 뒤 수정 여부와 이유를 직접 결정하세요." }
    ],
    realLifeMaterialIds: []
  }
];

export const courseTracks: CourseTrack[] = [
  {
    id: "structure",
    optionLabel: "A안",
    title: "문장 구조 중심",
    description: "홑문장·이어진문장·안은문장의 구조와 표현 효과를 깊게 탐구해요.",
    badge: "기존 수업안"
  },
  {
    id: "grammar",
    optionLabel: "B안",
    title: "구조+문법 요소",
    description: "문장 구조에 시간·높임·피동·사동·부정 표현을 더해 상황에 맞게 써요.",
    badge: "새 확장 수업안"
  }
];

export function getCourseLessons(trackId: CourseTrackId = "structure") {
  return trackId === "grammar" ? grammarFiveLessonCourse : fiveLessonCourse;
}

export function getCourseTrack(trackId: CourseTrackId) {
  return courseTracks.find((track) => track.id === trackId) ?? courseTracks[0];
}

export function getCourseLesson(number: CourseLessonNumber, trackId: CourseTrackId = "structure") {
  const lessons = getCourseLessons(trackId);
  return lessons.find((lesson) => lesson.number === number) ?? lessons[0];
}
