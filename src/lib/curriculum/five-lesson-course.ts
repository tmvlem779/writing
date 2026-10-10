import type { Activity } from "@/lib/agent/schema";
import type { ConceptLesson } from "@/lib/curriculum/sentence-structure";
import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";

export type CourseLessonNumber = 1 | 2 | 3 | 4 | 5 | 6;
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
  completionCriterion?: string;
  modelAnswer?: string;
  usesAnswerFrom?: string;
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
      { id: "components", activity: "diagnose", label: "문장 성분 복습", prompt: "‘학생들이 운동장에서 공을 찬다.’에서 주어와 서술어를 찾아 적어 보세요." },
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

export const grammarSixLessonCourse: CourseLesson[] = [
  {
    number: 1,
    title: "문장의 기본 구조와 문장 생성",
    keyQuestion: "문장 성분을 어떻게 조합해야 뜻이 분명한 홑문장이 될까?",
    activities: ["문장 성분 역할 확인", "성분 카드 조합", "홑문장 생성", "구조 자기 설명"],
    conceptLessonId: "grammar-basic-sentence",
    practiceActivities: [
      { id: "grammar-components", activity: "diagnose", label: "성분 역할 찾기", prompt: "‘학생들이 운동장에서 공을 찬다.’에서 주어와 서술어를 찾아 적어 보세요.", modelAnswer: "주어는 ‘학생들이’, 서술어는 ‘찬다’입니다." },
      { id: "grammar-component-cards", activity: "compare", label: "성분 조합", prompt: "‘민지가 / 도서관에서 / 책을 / 읽는다’를 자연스러운 순서로 배열해 한 문장으로 적어 보세요.", modelAnswer: "민지가 도서관에서 책을 읽는다." },
      {
        id: "grammar-simple-create",
        activity: "create",
        label: "홑문장 만들기",
        prompt: "‘누가·어디에서·무엇을·어찌한다’가 드러나게 학교생활에 관한 홑문장 한 개를 만들어 보세요.",
        modelAnswer: "예: 학생들이 운동장에서 공을 찬다.",
        completionCriterion: "학교생활을 주제로 주어·서술어·목적어·부사어가 모두 포함된 홑문장을 학생이 직접 만들었다. 문장 성분 분석은 다음 활동에서 하므로 여기서 다시 묻지 않는다."
      },
      {
        id: "grammar-simple-explain",
        activity: "reflect",
        label: "구조 설명",
        prompt: "앞의 ‘홑문장 만들기’에서 만든 문장의 주어와 서술어를 찾고, 왜 홑문장인지 한 가지 근거를 적어 보세요.",
        modelAnswer: "예: ‘학생들이 운동장에서 공을 찬다.’의 주어는 ‘학생들이’, 서술어는 ‘찬다’입니다. 주어·서술어 관계가 한 번 나타나므로 홑문장입니다.",
        usesAnswerFrom: "grammar-simple-create"
      }
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
      { id: "grammar-clause-pairs", activity: "diagnose", label: "두 절 찾기", prompt: "‘비가 그쳤다. 경기가 시작되었다.’에서 두 문장의 주어와 서술어를 각각 짝지어 보세요.", modelAnswer: "첫 문장은 ‘비가-그쳤다’, 둘째 문장은 ‘경기가-시작되었다’입니다." },
      { id: "grammar-connective-choice", activity: "compare", label: "의미 관계 선택", prompt: "‘비가 그쳤다. 경기가 시작되었다.’를 ‘-고’ 또는 ‘-아서/어서’ 중 하나로 연결하고, 나열과 원인 중 어떤 관계인지 적어 보세요.", modelAnswer: "예: ‘비가 그쳐서 경기가 시작되었다.’는 원인 관계입니다." },
      { id: "grammar-connected-create", activity: "expand", label: "이어진문장 만들기", prompt: "학교 행사에 관한 짧은 두 문장을 만든 뒤 ‘-고’ 또는 ‘-아서/어서’로 한 문장으로 연결해 보세요.", modelAnswer: "예: 학교 축제가 열리고 학생들이 공연했다." },
      { id: "grammar-connected-effect", activity: "reflect", label: "효과 비교", prompt: "앞의 ‘이어진문장 만들기’에서 사용한 연결 어미를 다른 것으로 한 번 바꾸고, 뜻이 어떻게 달라졌는지 한 가지 적어 보세요.", modelAnswer: "예: ‘축제가 열리고 공연했다’는 두 일을 나란히 보여 주고, ‘축제가 열려서 공연했다’는 앞일을 원인처럼 보여 줍니다.", usesAnswerFrom: "grammar-connected-create" }
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
      { id: "grammar-embedded-boundary", activity: "diagnose", label: "안긴절 찾기", prompt: "‘나는 친구가 약속을 지켰음을 알았다.’에서 문장 안에 들어간 작은 문장을 찾아 괄호로 묶어 보세요.", modelAnswer: "나는 (친구가 약속을 지켰음)을 알았다." },
      { id: "grammar-embedded-role", activity: "compare", label: "절의 역할", prompt: "‘친구가 고른 책을 읽었다.’에서 ‘친구가 고른’이 꾸미는 말을 찾아보세요.", modelAnswer: "‘친구가 고른’은 뒤의 ‘책’을 꾸밉니다." },
      { id: "grammar-embedded-transform", activity: "expand", label: "문장 확대", prompt: "‘친구가 발표한다.’를 다른 문장 속에 넣어 문장 한 개를 만들어 보세요.", modelAnswer: "예: 나는 친구가 발표하는 모습을 보았다." },
      { id: "grammar-embedded-effect", activity: "reflect", label: "확대 효과", prompt: "앞의 ‘문장 확대’에서 만든 문장에 새로 더해진 정보가 무엇인지 한 가지 적어 보세요.", modelAnswer: "예: ‘친구가 발표한다’는 정보가 ‘모습’을 구체적으로 꾸며 줍니다.", usesAnswerFrom: "grammar-embedded-transform" }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 4,
    title: "종결·높임·시간 표현",
    keyQuestion: "종결·높임·시간 표현은 상황과 의미를 어떻게 드러낼까?",
    activities: ["종결 표현 기능 분석", "높임 대상과 방법 구별", "시제·상 변형", "상황별 표현 선택", "표현 효과 설명"],
    conceptLessonId: "grammar-ending-honor-time",
    practiceActivities: [
      { id: "grammar-ending", activity: "compare", label: "종결 표현", prompt: "‘창문을 닫아 줄래?’가 질문과 요청 중 어느 쪽에 가까운지 고르고, 이유를 한 가지 적어 보세요.", modelAnswer: "질문 형식이지만 실제로는 창문을 닫아 달라는 요청에 가깝습니다." },
      { id: "grammar-time", activity: "compare", label: "시간 표현", prompt: "‘학생이 운동장을 달린다.’를 과거 표현과 지금 진행 중인 표현으로 바꾸어 보세요.", modelAnswer: "과거는 ‘학생이 운동장을 달렸다.’, 진행 중은 ‘학생이 운동장을 달리고 있다.’입니다." },
      { id: "grammar-honorific", activity: "create", label: "높임 표현", prompt: "‘선생님이 교실에 있다.’를 선생님을 높이는 문장으로 바꾸어 보세요.", modelAnswer: "선생님께서 교실에 계신다." },
      { id: "grammar-ending-context", activity: "transfer", label: "상황별 선택", prompt: "‘조용히 해 달라’는 뜻을 친구에게 말할 때와 선생님께 말할 때에 맞게 한 문장씩 써 보세요.", modelAnswer: "친구에게는 ‘조용히 해 줄래?’, 선생님께는 ‘잠시 조용히 해 주시겠어요?’라고 할 수 있습니다." },
      { id: "grammar-ending-effect", activity: "reflect", label: "표현 효과 설명", prompt: "앞의 ‘상황별 선택’에서 만든 두 문장 중 높임이 더 잘 드러나는 문장을 고르고, 그렇게 생각한 표현을 한 가지 적어 보세요.", modelAnswer: "‘잠시 조용히 해 주시겠어요?’에서 ‘-주시겠어요?’가 상대를 높이는 태도를 드러냅니다.", usesAnswerFrom: "grammar-ending-context" }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 5,
    title: "피동·사동·부정·인용 표현",
    keyQuestion: "피동·사동·부정·인용 표현은 정보의 초점과 관점을 어떻게 바꿀까?",
    activities: ["능동·피동 비교", "주동·사동 비교", "부정 의미·범위 분석", "직접·간접 인용 변환", "표현 적절성 평가"],
    conceptLessonId: "grammar-voice-negation-quotation",
    practiceActivities: [
      { id: "grammar-passive", activity: "compare", label: "피동 표현", prompt: "‘학생이 창문을 열었다.’를 창문이 주어가 되도록 바꾸어 보세요.", modelAnswer: "창문이 학생에 의해 열렸다." },
      { id: "grammar-causative", activity: "compare", label: "사동 표현", prompt: "‘아이가 책을 읽는다.’를 어머니가 아이에게 읽도록 시키는 문장으로 바꾸어 보세요.", modelAnswer: "어머니가 아이에게 책을 읽게 한다." },
      { id: "grammar-negation", activity: "error", label: "부정 표현", prompt: "‘나는 발표하지 않았다.’와 ‘나는 발표하지 못했다.’ 중 능력이나 상황 때문에 할 수 없었다는 뜻의 문장을 고르세요.", modelAnswer: "‘나는 발표하지 못했다.’가 능력이나 상황 때문에 할 수 없었다는 뜻입니다." },
      { id: "grammar-quotation", activity: "transfer", label: "인용 표현", prompt: "민지의 말 ‘나는 내일 발표할 거야.’를 ‘민지는’으로 시작하는 간접 인용문으로 바꾸어 보세요.", modelAnswer: "민지는 다음 날 발표하겠다고 말했다." },
      { id: "grammar-voice-effect", activity: "reflect", label: "표현 적절성 평가", prompt: "피동·사동·부정·인용 표현 중 하나를 골라 짧은 문장 한 개를 만들고, 사용한 표현의 이름을 적어 보세요.", modelAnswer: "예: ‘창문이 바람에 열렸다.’는 피동 표현입니다." }
    ],
    realLifeMaterialIds: []
  },
  {
    number: 6,
    title: "구조와 문법 요소의 종합적 활용",
    keyQuestion: "상황에 맞는 구조와 문법 요소로 의도한 의미를 표현할 수 있을까?",
    activities: ["핵심 개념 정리 노트", "담화 맥락 분석", "조건 문장 생성", "상황별 변형", "선택 이유 설명", "상호 피드백"],
    conceptLessonId: "grammar-synthesis",
    practiceActivities: [
      { id: "grammar-context", activity: "diagnose", label: "맥락 분석", prompt: "교장 선생님께 창문을 닫아 달라고 부탁하는 문장을 한 개 써 보세요.", modelAnswer: "교장 선생님, 창문을 닫아 주시겠어요?" },
      { id: "grammar-integrated-create", activity: "create", label: "종합 문장 생성", prompt: "학교 행사 안내를 이어진문장이나 안은문장으로 한 개 쓰고, 높임·시간·부정 표현 중 하나를 사용해 보세요.", modelAnswer: "예: 비가 와서 행사가 체육관에서 열립니다." },
      { id: "grammar-context-transform", activity: "transfer", label: "상황별 변형", prompt: "앞의 ‘종합 문장 생성’에서 쓴 문장을 친구에게 말하는 표현으로 한 번 바꾸어 보세요.", modelAnswer: "예: ‘비가 와서 행사가 체육관에서 열립니다.’를 ‘비가 와서 행사를 체육관에서 해.’로 바꿀 수 있습니다.", usesAnswerFrom: "grammar-integrated-create" },
      { id: "grammar-self-explain", activity: "reflect", label: "선택 이유 설명", prompt: "앞의 ‘상황별 변형’에서 바꾼 표현 한 가지를 고르고, 왜 바꾸었는지 적어 보세요.", modelAnswer: "예: 친구에게 말하는 상황이라 공식적인 ‘-습니다’를 편한 표현인 ‘-해’로 바꾸었습니다.", usesAnswerFrom: "grammar-context-transform" },
      { id: "grammar-peer-review", activity: "error", label: "상호 피드백·평가", prompt: "앞의 ‘상황별 변형’ 문장이 상황에 어울리는지 한 가지 기준으로 확인하고, 고칠 부분이 있으면 한 번 고쳐 보세요.", modelAnswer: "예: ‘친구에게 자연스러운가’를 확인하고, ‘행사가 체육관에서 열립니다’를 ‘행사를 체육관에서 해’로 고칩니다.", usesAnswerFrom: "grammar-context-transform" }
    ],
    realLifeMaterialIds: []
  }
];

export const courseTracks: CourseTrack[] = [
  {
    id: "grammar",
    optionLabel: "6차시 수업",
    title: "구조+문법 요소",
    description: "문장 구조에 종결·높임·시간·피동·사동·부정·인용 표현을 더해 상황에 맞게 써요.",
    badge: "새 확장 수업안"
  }
];

export function getCourseLessons(trackId: CourseTrackId = "grammar") {
  return trackId === "grammar" ? grammarSixLessonCourse : fiveLessonCourse;
}

export function getCourseTrack(trackId: CourseTrackId) {
  return courseTracks.find((track) => track.id === trackId) ?? courseTracks[0];
}

export function getCourseLesson(number: CourseLessonNumber, trackId: CourseTrackId = "grammar") {
  const lessons = getCourseLessons(trackId);
  return lessons.find((lesson) => lesson.number === number) ?? lessons[0];
}
