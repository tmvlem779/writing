import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";
import type { SituationSceneId } from "@/lib/curriculum/situation-writing";

export type DailyPracticeType = "literature" | "authentic" | "sentence-making";
export type DailyPracticeMaterialId = RealLifeMaterialKind | SituationSceneId;

export type DailyPracticePlan = {
  date: string;
  type: DailyPracticeType;
  typeLabel: string;
  materialId: DailyPracticeMaterialId;
  title: string;
  description: string;
  icon: "book" | "news" | "pencil";
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
  { id: "rainy-gate", title: "비 오는 등굣길 문장 만들기", description: "그림 속 두 사실을 관계가 드러나는 한 문장으로 만들어요." },
  { id: "library-help", title: "도서관에서 문장 만들기", description: "상황에 맞는 높임 표현을 사용해 문장을 만들어요." },
  { id: "group-presentation", title: "모둠 발표 문장 만들기", description: "여러 행동을 알맞은 의미 관계로 연결해요." }
] satisfies Array<{ id: SituationSceneId; title: string; description: string }>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseCalendarDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
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
  const typeIndex = positiveModulo(dayIndex, 3);
  const cycleIndex = Math.floor(dayIndex / 3);

  if (typeIndex === 0) {
    const item = literatureItems[positiveModulo(cycleIndex, literatureItems.length)];
    return { date, type: "literature", typeLabel: "문학 작품", materialId: item.id, title: item.title, description: item.description, icon: "book" };
  }
  if (typeIndex === 1) {
    const item = authenticItems[positiveModulo(cycleIndex, authenticItems.length)];
    return { date, type: "authentic", typeLabel: "실생활 자료", materialId: item.id, title: item.title, description: item.description, icon: "news" };
  }

  const item = sentenceItems[positiveModulo(cycleIndex, sentenceItems.length)];
  return { date, type: "sentence-making", typeLabel: "문장 만들기", materialId: item.id, title: item.title, description: item.description, icon: "pencil" };
}

function formatRoadmapDate(date: string) {
  const parsed = parseCalendarDate(date);
  return {
    dayLabel: new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" }).format(parsed),
    dateLabel: new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", timeZone: "UTC" }).format(parsed)
  };
}

export function buildDailyRoadmap(today: string, completedDates: Iterable<string>, daysBefore = 3, daysAfter = 3): DailyRoadmapDay[] {
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
