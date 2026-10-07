import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";
import { errorCorrectionItems, type ErrorCorrectionItemId } from "../curriculum/error-correction.ts";
import type { SituationSceneId } from "@/lib/curriculum/situation-writing";

export type DailyPracticeType = "literature" | "authentic" | "sentence-making" | "concept-learning" | "error-correction";
export type DailyPracticeMaterialId = RealLifeMaterialKind | SituationSceneId | ErrorCorrectionItemId | string;

export type DailyPracticePlan = {
  date: string;
  type: DailyPracticeType;
  typeLabel: string;
  materialId: DailyPracticeMaterialId;
  title: string;
  description: string;
  icon: "book" | "news" | "pencil" | "concept" | "error";
};

export type DailyRoadmapDay = DailyPracticePlan & {
  dayLabel: string;
  dateLabel: string;
  status: "completed" | "today" | "missed" | "locked";
};

const DAILY_EPOCH = "2026-10-01";

const literatureItems = [
  { id: "literature", title: "〈진달래꽃〉 문법 요소 탐구", description: "시의 구절을 고르고 문법 형태와 표현 효과를 살펴봐요." },
  { id: "literature-dongbaek", title: "〈동백꽃〉 문장 구조 탐구", description: "소설 문장에 직접 표시하며 구조의 단서를 찾아요." },
  { id: "literature-sanyuhwa", title: "〈산유화〉 문법 요소 탐구", description: "반복과 생략, 종결 표현이 만드는 효과를 살펴봐요." },
  { id: "literature-unsu", title: "〈운수 좋은 날〉 문장 구조 탐구", description: "서술과 대화 문장에 직접 표시하며 구조를 판단해요." }
] satisfies Array<{ id: RealLifeMaterialKind; title: string; description: string }>;

const authenticItems = [
  { id: "article", title: "기사 문장 살펴보기", description: "기사의 문장 구조와 정보 전달 효과를 분석해요." },
  { id: "notice", title: "안내문 고쳐 쓰기", description: "안내문의 독자와 목적에 맞게 문장을 다듬어요." },
  { id: "dialogue", title: "대화 속 문법 찾기", description: "대화 상황에 맞는 문법 표현과 의미를 살펴봐요." },
  { id: "presentation", title: "발표 문장 구성하기", description: "발표의 흐름을 만드는 문장 관계를 분석해요." },
  { id: "interview", title: "인터뷰 표현 탐구", description: "질문과 답변에 드러난 인용과 높임 표현을 살펴봐요." },
  { id: "social", title: "SNS 문장 다듬기", description: "짧은 글의 맥락과 독자를 고려해 문장을 고쳐 써요." }
] satisfies Array<{ id: RealLifeMaterialKind; title: string; description: string }>;

const sentenceItems = [
  { id: "rainy-gate", title: "비 오는 등굣길 문장 만들기", description: "상황에 제시된 두 사실을 관계가 드러나는 한 문장으로 만들어요." },
  { id: "library-help", title: "도서관에서 문장 만들기", description: "상황에 맞는 높임 표현을 사용해 문장을 만들어요." },
  { id: "group-presentation", title: "모둠 발표 문장 만들기", description: "여러 행동을 알맞은 의미 관계로 연결해요." }
] satisfies Array<{ id: SituationSceneId; title: string; description: string }>;

const conceptItems = [
  { id: "subject-predicate", title: "주어와 서술어 찾기", description: "누가 무엇을 하는지 살피며 문장의 기본 구조를 확인해요." },
  { id: "clause-count", title: "홑문장과 겹문장 구별하기", description: "주어·서술어 관계의 수를 근거로 문장 구조를 판단해요." },
  { id: "connected-meaning", title: "이어진문장의 의미 관계", description: "앞절과 뒤 절이 어떤 의미로 이어지는지 살펴봐요." },
  { id: "embedded-role", title: "안긴문장의 역할 찾기", description: "안긴문장이 다른 말을 어떻게 꾸미거나 대신하는지 확인해요." },
  { id: "honorific-time", title: "높임과 시간 표현 살펴보기", description: "높이는 대상과 사건이 일어난 시간을 나누어 판단해요." },
  { id: "voice-causative", title: "피동·사동 표현 구별하기", description: "행동의 주체와 행동을 하게 한 사람의 관계를 살펴봐요." },
  { id: "negation-meaning", title: "부정 표현의 의미 구별하기", description: "의지와 능력·상황에 따른 부정의 차이를 판단해요." },
  { id: "quotation-context", title: "인용 표현을 맥락에 맞게 바꾸기", description: "말한 사람과 시점에 맞게 인칭과 시간 표현을 바꿔요." }
] as const;

const practiceTypes = ["literature", "authentic", "sentence-making", "concept-learning", "error-correction"] as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseCalendarDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function shuffledPracticeTypes(blockIndex: number): DailyPracticeType[] {
  const shuffled = [...practiceTypes];
  let state = (Math.imul(blockIndex, 2654435761) ^ 0x85ebca6b) >>> 0;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function getKoreanDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addCalendarDays(date: string, amount: number) {
  const next = parseCalendarDate(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next.toISOString().slice(0, 10);
}

export function calendarDayDistance(from: string, to: string) {
  return Math.round((parseCalendarDate(to).getTime() - parseCalendarDate(from).getTime()) / DAY_IN_MS);
}

export function getDailyPracticePlan(date: string): DailyPracticePlan {
  const dayIndex = calendarDayDistance(DAILY_EPOCH, date);
  const blockIndex = Math.floor(dayIndex / practiceTypes.length);
  const typeIndex = positiveModulo(dayIndex, practiceTypes.length);
  const type = shuffledPracticeTypes(blockIndex)[typeIndex];

  if (type === "literature") {
    const item = literatureItems[positiveModulo(blockIndex, literatureItems.length)];
    return { date, type: "literature", typeLabel: "문학 작품", materialId: item.id, title: item.title, description: item.description, icon: "book" };
  }
  if (type === "authentic") {
    const item = authenticItems[positiveModulo(blockIndex, authenticItems.length)];
    return { date, type: "authentic", typeLabel: "실생활 자료", materialId: item.id, title: item.title, description: item.description, icon: "news" };
  }
  if (type === "sentence-making") {
    const item = sentenceItems[positiveModulo(blockIndex, sentenceItems.length)];
    return { date, type: "sentence-making", typeLabel: "문장 만들기", materialId: item.id, title: item.title, description: item.description, icon: "pencil" };
  }
  if (type === "error-correction") {
    const item = errorCorrectionItems[positiveModulo(blockIndex, errorCorrectionItems.length)];
    return {
      date,
      type: "error-correction",
      typeLabel: "틀린 문장 고치기",
      materialId: item.id,
      title: item.title,
      description: "틀린 부분에 밑줄을 긋고 문장을 바르게 고친 뒤 그 이유를 설명해요.",
      icon: "error"
    };
  }

  const item = conceptItems[positiveModulo(blockIndex, conceptItems.length)];
  return { date, type: "concept-learning", typeLabel: "개념학습", materialId: item.id, title: item.title, description: item.description, icon: "concept" };
}

function formatRoadmapDate(date: string) {
  const parsed = parseCalendarDate(date);
  return {
    dayLabel: new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" }).format(parsed),
    dateLabel: new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", timeZone: "UTC" }).format(parsed)
  };
}

export function buildDailyRoadmap(today: string, completedDates: Iterable<string>, daysBefore = 14, daysAfter = 15): DailyRoadmapDay[] {
  const completed = new Set(completedDates);
  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, index) => {
    const offset = index - daysBefore;
    const date = addCalendarDays(today, offset);
    const labels = formatRoadmapDate(date);
    const status = completed.has(date)
      ? "completed"
      : offset === 0
        ? "today"
        : offset < 0
          ? "missed"
          : "locked";
    return { ...getDailyPracticePlan(date), ...labels, status };
  });
}

export function getSelectablePracticeDate(requestedDate: string | undefined, today: string, daysBefore = 14) {
  if (!requestedDate || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return today;
  const distance = calendarDayDistance(requestedDate, today);
  return distance >= 0 && distance <= daysBefore ? requestedDate : today;
}

export function calculateDailyStreak(completedDates: Iterable<string>, today: string) {
  const completed = new Set(completedDates);
  let cursor = completed.has(today) ? today : addCalendarDays(today, -1);
  let streak = 0;
  while (completed.has(cursor)) {
    streak += 1;
    cursor = addCalendarDays(cursor, -1);
  }
  return streak;
}

export function getRecentSevenDays(today: string, completedDates: Iterable<string>) {
  const completed = new Set(completedDates);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addCalendarDays(today, index - 6);
    const labels = formatRoadmapDate(date);
    return { date, ...labels, completed: completed.has(date), today: date === today };
  });
}
