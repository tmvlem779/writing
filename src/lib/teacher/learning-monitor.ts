import { scaffoldLabel } from "../agent/state-machine.ts";
import { grammarSixLessonCourse } from "../curriculum/five-lesson-course.ts";
import { buildDailyRoadmap, getKoreanDate } from "../learning/daily-practice.ts";

export type LearningArea = "challenge" | "self-study" | "wrong-notes";

export type MonitorSession = {
  id: string;
  activityType: string;
  status: string;
  updatedAt: string;
};

export type MonitorConcept = {
  conceptCode: string;
  scaffoldLevel: number;
  evidenceCount: number;
  independentSuccessCount: number;
};

export type MonitorEvent = {
  sessionId: string;
  eventType: string;
  conceptCode: string | null;
  metadata: unknown;
  createdAt: string;
};

export type MonitorWrongAnswer = {
  source: "diagnosis" | "challenge" | "self-study";
  sourceLabel: string;
  problemTitle: string;
  question: string;
  submittedAnswer: string;
  feedbackHint: string;
  attemptCount: number;
  resolvedAt: string | null;
  updatedAt: string;
};

export type MonitorChallengeProgress = {
  lessonNumber: number;
  conceptCompleted: boolean;
  completedActivityIds: string[];
  updatedAt: string;
};

export type StudentMonitorInput = {
  userId: string;
  name: string;
  loginId: string;
  sessions: MonitorSession[];
  concepts: MonitorConcept[];
  events: MonitorEvent[];
  wrongAnswers: MonitorWrongAnswer[];
  challengeProgress: MonitorChallengeProgress[];
  now?: Date;
};

export type AreaMonitor = {
  id: LearningArea;
  label: string;
  state: "studying" | "recent" | "not-started" | "needs-review";
  stateLabel: string;
  lastSeenAt: string | null;
  metrics: Array<{ label: string; value: string }>;
  detail: string;
  progress: number;
  progressLabel: string;
};

export type WrongAnswerDetail = MonitorWrongAnswer & { areaLabel: string };

export type AiSupportUsage = {
  areaLabel: string;
  conceptLabel: string;
  supportLabel: string;
  createdAt: string;
};

export type ChallengeActivityStatus = {
  lessonNumber: number;
  title: string;
  state: "completed" | "partial" | "not-started";
  conceptCompleted: boolean;
  completedActivities: string[];
  totalActivities: number;
  updatedAt: string | null;
};

export type SelfStudyActivityStatus = {
  sequence: number;
  state: "completed" | "not-completed";
  typeLabel: string;
  title: string;
  completedAt: string | null;
};

export type LearningAnalysis = {
  hintCount: number;
  hintByArea: Array<{ label: string; count: number }>;
  hintByConcept: Array<{ label: string; count: number }>;
  wrongByType: Array<{ label: string; count: number; attempts: number }>;
  independentSuccesses: number;
  evidenceCount: number;
  recommendations: Array<{ title: string; evidence: string }>;
};

export type StudentLearningMonitor = {
  userId: string;
  name: string;
  loginId: string;
  areas: AreaMonitor[];
  wrongAnswers: WrongAnswerDetail[];
  aiSupport: AiSupportUsage[];
  diagnosis: Array<{ level: "attention" | "watch" | "steady"; title: string; evidence: string }>;
  challengeActivities: ChallengeActivityStatus[];
  selfStudyActivities: SelfStudyActivityStatus[];
  wrongNoteSummary: { total: number; unresolved: number; resolved: number };
  analysis: LearningAnalysis;
};

export type ClassLearningPriority = {
  title: string;
  evidence: string;
  supplement: string;
};

export type ClassLearningAnalysis = {
  studentCount: number;
  activeStudentCount: number;
  hintCount: number;
  unresolvedWrongCount: number;
  independentSuccesses: number;
  evidenceCount: number;
  priorities: ClassLearningPriority[];
};

const conceptLabels: Record<string, string> = {
  diagnose: "문장 기초",
  create: "문장 만들기",
  expand: "문장 확대",
  compare: "구조 비교",
  error: "오류 탐구",
  transfer: "실제 언어 적용",
  reflect: "성찰",
  authentic: "실생활 자료"
};

function metadataArea(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>).learningArea;
  return value === "challenge" || value === "self-study" ? value : null;
}

function metadataNumber(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return 0;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function metadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function countLabels(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
}

function newest(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function stateFrom(lastSeenAt: string | null, needsReview: boolean, now: Date) {
  if (needsReview) return { state: "needs-review" as const, stateLabel: "다시 볼 지점 있음" };
  if (!lastSeenAt) return { state: "not-started" as const, stateLabel: "미시작" };
  const minutes = (now.getTime() - new Date(lastSeenAt).getTime()) / 60_000;
  return minutes <= 5
    ? { state: "studying" as const, stateLabel: "지금 학습 중" }
    : { state: "recent" as const, stateLabel: "최근 학습" };
}

function sourceLabel(source: MonitorWrongAnswer["source"]) {
  if (source === "challenge") return "오늘의 챌린지";
  if (source === "self-study") return "스스로 유형학습";
  return "개념학습";
}

export function buildStudentLearningMonitor(input: StudentMonitorInput): StudentLearningMonitor {
  const now = input.now ?? new Date();
  const areaStartEvents = input.events.filter((event) => event.eventType === "area_started");
  const challengeStarts = areaStartEvents.filter((event) => metadataArea(event.metadata) === "challenge");
  const selfStudyStarts = areaStartEvents.filter((event) => metadataArea(event.metadata) === "self-study");
  const challengeSessionIds = new Set(challengeStarts.map((event) => event.sessionId));
  const selfStudySessionIds = new Set(selfStudyStarts.map((event) => event.sessionId));
  const legacySessions = areaStartEvents.length === 0 ? input.sessions : [];
  const challengeSessions = input.sessions.filter((session) => challengeSessionIds.has(session.id)).concat(legacySessions);
  const selfStudySessions = input.sessions.filter((session) => selfStudySessionIds.has(session.id));
  const dailyCompletions = input.events.filter((event) => event.eventType === "daily_practice_completed");
  const challengeWrong = input.wrongAnswers.filter((answer) => answer.source === "challenge");
  const selfStudyWrong = input.wrongAnswers.filter((answer) => answer.source === "self-study");
  const unresolvedChallenge = challengeWrong.filter((answer) => !answer.resolvedAt);
  const unresolvedSelfStudy = selfStudyWrong.filter((answer) => !answer.resolvedAt);
  const unresolvedAll = input.wrongAnswers.filter((answer) => !answer.resolvedAt);
  const resolvedAll = input.wrongAnswers.filter((answer) => answer.resolvedAt);
  const completedChallengeLessons = new Set(
    input.challengeProgress.filter((item) => item.conceptCompleted).map((item) => item.lessonNumber)
  ).size;
  const completedSelfStudyDays = Math.min(30, dailyCompletions.length);

  const challengeLastSeen = newest([
    ...challengeSessions.map((session) => session.updatedAt),
    ...challengeStarts.map((event) => event.createdAt),
    ...challengeWrong.map((answer) => answer.updatedAt)
  ]);
  const selfStudyLastSeen = newest([
    ...selfStudySessions.map((session) => session.updatedAt),
    ...selfStudyStarts.map((event) => event.createdAt),
    ...dailyCompletions.map((event) => event.createdAt),
    ...selfStudyWrong.map((answer) => answer.updatedAt)
  ]);
  const wrongNotesLastSeen = newest(input.wrongAnswers.map((answer) => answer.updatedAt));
  const challengeState = stateFrom(challengeLastSeen, unresolvedChallenge.length > 0, now);
  const selfStudyState = stateFrom(selfStudyLastSeen, unresolvedSelfStudy.length > 0, now);
  const wrongNotesState = stateFrom(wrongNotesLastSeen, unresolvedAll.length > 0, now);
  const independentSuccesses = input.concepts.reduce((sum, concept) => sum + concept.independentSuccessCount, 0);
  const evidenceCount = input.concepts.reduce((sum, concept) => sum + concept.evidenceCount, 0);
  const sessionArea = new Map<string, LearningArea>();
  for (const event of areaStartEvents) {
    const area = metadataArea(event.metadata);
    if (area) sessionArea.set(event.sessionId, area);
  }
  const scaffoldEvents = input.events
    .filter((event) => metadataNumber(event.metadata, "scaffold_level") > 0)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const aiSupport = scaffoldEvents.slice(0, 8).map((event) => {
      const area = sessionArea.get(event.sessionId) ?? "challenge";
      const level = metadataNumber(event.metadata, "scaffold_level");
      return {
        areaLabel: area === "self-study" ? "스스로 유형학습" : "오늘의 챌린지",
        conceptLabel: conceptLabels[event.conceptCode ?? ""] ?? event.conceptCode ?? "문장 탐구",
        supportLabel: scaffoldLabel(level),
        createdAt: event.createdAt
      };
    });
  const wrongAnswerDetails = [...input.wrongAnswers]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 8)
    .map((answer) => ({ ...answer, areaLabel: sourceLabel(answer.source) }));

  const diagnosis: StudentLearningMonitor["diagnosis"] = [];
  const repeatedWrong = [...unresolvedAll].sort((a, b) => b.attemptCount - a.attemptCount)[0];
  if (repeatedWrong?.attemptCount >= 2) {
    diagnosis.push({
      level: "attention",
      title: `${repeatedWrong.problemTitle}에서 반복해 막히고 있어요`,
      evidence: `${sourceLabel(repeatedWrong.source)}에서 같은 문제를 ${repeatedWrong.attemptCount}회 틀렸습니다.`
    });
  }
  const highestScaffold = [...input.concepts].sort((a, b) => b.scaffoldLevel - a.scaffoldLevel)[0];
  if (highestScaffold && highestScaffold.scaffoldLevel >= 3) {
    diagnosis.push({
      level: "attention",
      title: `${conceptLabels[highestScaffold.conceptCode] ?? highestScaffold.conceptCode}에서 구체적인 도움이 필요해요`,
      evidence: `현재 비계가 '${scaffoldLabel(highestScaffold.scaffoldLevel)}' 단계입니다.`
    });
  }
  const lowIndependence = [...input.concepts]
    .filter((concept) => concept.evidenceCount >= 2 && concept.independentSuccessCount / concept.evidenceCount < 0.5)
    .sort((a, b) => (a.independentSuccessCount / a.evidenceCount) - (b.independentSuccessCount / b.evidenceCount))[0];
  if (lowIndependence && diagnosis.length < 3) {
    diagnosis.push({
      level: "watch",
      title: `${conceptLabels[lowIndependence.conceptCode] ?? lowIndependence.conceptCode}을 혼자 설명하는 연습이 더 필요해요`,
      evidence: `${lowIndependence.evidenceCount}개 근거 중 ${lowIndependence.independentSuccessCount}개를 도움 없이 해결했습니다.`
    });
  }
  if (diagnosis.length === 0) {
    diagnosis.push({
      level: "steady",
      title: input.sessions.length === 0 && input.wrongAnswers.length === 0 ? "아직 진단할 학습 기록이 없어요" : "현재 뚜렷한 정체 신호는 없어요",
      evidence: input.sessions.length === 0 && input.wrongAnswers.length === 0
        ? "학생이 활동을 시작하면 오답과 도움 사용 기록을 바탕으로 진단합니다."
        : "반복 오답과 높은 단계의 비계 사용이 확인되지 않았습니다."
    });
  }

  const challengeActivities: ChallengeActivityStatus[] = grammarSixLessonCourse.map((lesson) => {
    const progress = input.challengeProgress.find((item) => item.lessonNumber === lesson.number);
    const completedIds = new Set(progress?.completedActivityIds ?? []);
    const completedActivities = lesson.practiceActivities.filter((activity) => completedIds.has(activity.id)).map((activity) => activity.label);
    const hasProgress = Boolean(progress?.conceptCompleted || completedActivities.length > 0);
    const state = progress?.conceptCompleted && completedActivities.length >= lesson.practiceActivities.length
      ? "completed" as const
      : hasProgress
        ? "partial" as const
        : "not-started" as const;
    return {
      lessonNumber: lesson.number,
      title: lesson.title,
      state,
      conceptCompleted: progress?.conceptCompleted ?? false,
      completedActivities,
      totalActivities: lesson.practiceActivities.length,
      updatedAt: progress?.updatedAt ?? null
    };
  });
  const practiceTypeLabels: Record<string, string> = {
    literature: "문학 작품",
    authentic: "실생활 자료",
    "sentence-making": "문장 만들기",
    "concept-learning": "개념학습",
    "error-correction": "틀린 문장 고치기"
  };
  const uniqueDailyCompletions = new Map<string, MonitorEvent>();
  for (const event of [...dailyCompletions].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))) {
    uniqueDailyCompletions.set(metadataString(event.metadata, "practiceDate") ?? event.createdAt, event);
  }
  const roadmap = buildDailyRoadmap(getKoreanDate(now), uniqueDailyCompletions.keys());
  const selfStudyActivities: SelfStudyActivityStatus[] = roadmap.map((day, index) => {
    const event = uniqueDailyCompletions.get(day.date);
    const practiceType = event ? metadataString(event.metadata, "practiceType") : null;
    return {
      sequence: index + 1,
      state: event ? "completed" as const : "not-completed" as const,
      typeLabel: practiceType ? practiceTypeLabels[practiceType] ?? practiceType : day.typeLabel,
      title: event ? metadataString(event.metadata, "title") ?? day.title : day.title,
      completedAt: event?.createdAt ?? null
    };
  });
  const hintByArea = countLabels(scaffoldEvents.map((event) => {
    const area = sessionArea.get(event.sessionId) ?? "challenge";
    return area === "self-study" ? "스스로 유형학습" : "오늘의 챌린지";
  }));
  const hintByConcept = countLabels(scaffoldEvents.map((event) => conceptLabels[event.conceptCode ?? ""] ?? event.conceptCode ?? "문장 탐구"));
  const wrongGroups = new Map<string, { count: number; attempts: number }>();
  for (const answer of input.wrongAnswers) {
    const current = wrongGroups.get(answer.problemTitle) ?? { count: 0, attempts: 0 };
    wrongGroups.set(answer.problemTitle, { count: current.count + 1, attempts: current.attempts + answer.attemptCount });
  }
  const wrongByType = [...wrongGroups.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.count - a.count || b.attempts - a.attempts || a.label.localeCompare(b.label, "ko"));
  const recommendations: LearningAnalysis["recommendations"] = [];
  if (wrongByType[0]) {
    recommendations.push({
      title: `오답노트에서 ‘${wrongByType[0].label}’ 다시 해결하기`,
      evidence: `${wrongByType[0].count}개 오답에서 총 ${wrongByType[0].attempts}회 시도한 기록이 있습니다.`
    });
  }
  if (hintByConcept[0]) {
    recommendations.push({
      title: `‘${hintByConcept[0].label}’ 개념을 힌트 없이 한 번 더 설명하기`,
      evidence: `이 개념에서 AI 힌트를 ${hintByConcept[0].count}회 사용했습니다.`
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: input.sessions.length === 0 ? "첫 학습 활동 시작하기" : "다음 미완료 활동 이어서 학습하기",
      evidence: input.sessions.length === 0 ? "아직 분석할 학습 기록이 없습니다." : "반복 오답이나 AI 힌트 사용이 확인되지 않았습니다."
    });
  }

  return {
    userId: input.userId,
    name: input.name,
    loginId: input.loginId,
    areas: [
      {
        id: "challenge",
        label: "오늘의 챌린지",
        ...challengeState,
        lastSeenAt: challengeLastSeen,
        metrics: [
          { label: "완료 차시", value: `${completedChallengeLessons}/6` },
          { label: "독립 성공", value: `${independentSuccesses}/${evidenceCount}` },
          { label: "미해결 오답", value: `${unresolvedChallenge.length}개` }
        ],
        detail: challengeSessions.length > 0 ? "문장 구조 학습과 AI 비계 사용 기록을 확인합니다." : "아직 오늘의 챌린지 학습 기록이 없습니다.",
        progress: Math.round((completedChallengeLessons / 6) * 100),
        progressLabel: `6차시 중 ${completedChallengeLessons}차시 개념 완료`
      },
      {
        id: "self-study",
        label: "스스로 유형학습",
        ...selfStudyState,
        lastSeenAt: selfStudyLastSeen,
        metrics: [
          { label: "완료한 하루", value: `${completedSelfStudyDays}일` },
          { label: "학습 세션", value: `${selfStudySessions.length}개` },
          { label: "미해결 오답", value: `${unresolvedSelfStudy.length}개` }
        ],
        detail: dailyCompletions.length > 0 ? "일일 학습 완료와 유형 활동 기록을 확인합니다." : "아직 완료한 스스로 유형학습이 없습니다.",
        progress: Math.round((completedSelfStudyDays / 30) * 100),
        progressLabel: `30일 중 ${completedSelfStudyDays}일 완료`
      },
      {
        id: "wrong-notes",
        label: "오답노트",
        ...wrongNotesState,
        lastSeenAt: wrongNotesLastSeen,
        metrics: [
          { label: "전체 오답", value: `${input.wrongAnswers.length}개` },
          { label: "다시 볼 문제", value: `${unresolvedAll.length}개` },
          { label: "다시 해결", value: `${resolvedAll.length}개` }
        ],
        detail: unresolvedAll.length > 0 ? "반복 횟수가 높은 문제부터 다시 살펴볼 필요가 있습니다." : "현재 남아 있는 미해결 오답이 없습니다.",
        progress: input.wrongAnswers.length === 0 ? 0 : Math.round((resolvedAll.length / input.wrongAnswers.length) * 100),
        progressLabel: input.wrongAnswers.length === 0
          ? "아직 기록된 오답이 없습니다"
          : `${input.wrongAnswers.length}개 중 ${resolvedAll.length}개 다시 해결`
      }
    ],
    wrongAnswers: wrongAnswerDetails,
    aiSupport,
    diagnosis: diagnosis.slice(0, 3),
    challengeActivities,
    selfStudyActivities,
    wrongNoteSummary: { total: input.wrongAnswers.length, unresolved: unresolvedAll.length, resolved: resolvedAll.length },
    analysis: {
      hintCount: scaffoldEvents.length,
      hintByArea,
      hintByConcept,
      wrongByType,
      independentSuccesses,
      evidenceCount,
      recommendations: recommendations.slice(0, 2)
    }
  };
}

export function buildClassLearningAnalysis(students: StudentLearningMonitor[]): ClassLearningAnalysis {
  const wrongByType = new Map<string, { count: number; attempts: number; students: Set<string> }>();
  const hintByConcept = new Map<string, { count: number; students: Set<string> }>();
  let hintCount = 0;
  let unresolvedWrongCount = 0;
  let independentSuccesses = 0;
  let evidenceCount = 0;
  let activeStudentCount = 0;

  for (const student of students) {
    const hasActivity = student.analysis.evidenceCount > 0
      || student.analysis.hintCount > 0
      || student.wrongNoteSummary.total > 0
      || student.challengeActivities.some((activity) => activity.state !== "not-started")
      || student.selfStudyActivities.some((activity) => activity.state === "completed");
    if (hasActivity) activeStudentCount += 1;
    hintCount += student.analysis.hintCount;
    unresolvedWrongCount += student.wrongNoteSummary.unresolved;
    independentSuccesses += student.analysis.independentSuccesses;
    evidenceCount += student.analysis.evidenceCount;

    for (const item of student.analysis.wrongByType) {
      const current = wrongByType.get(item.label) ?? { count: 0, attempts: 0, students: new Set<string>() };
      current.count += item.count;
      current.attempts += item.attempts;
      current.students.add(student.userId);
      wrongByType.set(item.label, current);
    }
    for (const item of student.analysis.hintByConcept) {
      const current = hintByConcept.get(item.label) ?? { count: 0, students: new Set<string>() };
      current.count += item.count;
      current.students.add(student.userId);
      hintByConcept.set(item.label, current);
    }
  }

  const topWrong = [...wrongByType.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].attempts - a[1].attempts || a[0].localeCompare(b[0], "ko"))[0];
  const topHint = [...hintByConcept.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "ko"))[0];
  const priorities: ClassLearningPriority[] = [];

  if (topWrong) {
    priorities.push({
      title: `‘${topWrong[0]}’ 오답 유형 보충`,
      evidence: `${topWrong[1].students.size}명의 학생에게서 ${topWrong[1].count}개 오답과 총 ${topWrong[1].attempts}회 시도가 확인됐습니다.`,
      supplement: "공통 예문 한 개를 함께 분석한 뒤, 틀린 부분 찾기 → 고쳐 쓰기 → 고친 이유 설명 순서로 짧게 다시 연습하세요."
    });
  }
  if (topHint) {
    priorities.push({
      title: `‘${topHint[0]}’ 독립 설명 연습`,
      evidence: `${topHint[1].students.size}명의 학생이 이 개념에서 AI 힌트를 ${topHint[1].count}회 사용했습니다.`,
      supplement: "교사가 첫 단서만 제시하고, 학생이 근거를 표시한 뒤 개념을 자기 말로 설명하는 무힌트 활동을 한 번 더 진행하세요."
    });
  }
  if (unresolvedWrongCount > 0) {
    priorities.push({
      title: "미해결 오답 다시 풀기",
      evidence: `학급에 아직 해결되지 않은 오답이 ${unresolvedWrongCount}개 남아 있습니다.`,
      supplement: "오답노트 시간을 따로 두고 같은 유형의 쉬운 문제부터 다시 해결한 뒤 원래 문제로 돌아오게 하세요."
    });
  }
  if (priorities.length === 0) {
    priorities.push({
      title: activeStudentCount === 0 ? "학습 기록을 먼저 모아 주세요" : "현재 공통 취약 신호가 뚜렷하지 않아요",
      evidence: activeStudentCount === 0
        ? "아직 학급 공통 경향을 판단할 학생 활동 기록이 없습니다."
        : "반복 오답과 AI 힌트 사용이 학급 공통 유형으로 모이지 않았습니다.",
      supplement: activeStudentCount === 0
        ? "오늘의 챌린지 한 차시를 진행한 뒤 오답과 힌트 사용 기록을 다시 확인하세요."
        : "현재 진도를 이어 가되, 학생별 분석에서 표시된 개별 취약 지점을 짧게 보충하세요."
    });
  }

  return {
    studentCount: students.length,
    activeStudentCount,
    hintCount,
    unresolvedWrongCount,
    independentSuccesses,
    evidenceCount,
    priorities: priorities.slice(0, 3)
  };
}
