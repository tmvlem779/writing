import { scaffoldLabel } from "../agent/state-machine.ts";

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
  attemptCount: number;
  resolvedAt: string | null;
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
};

export type StudentLearningMonitor = {
  userId: string;
  name: string;
  loginId: string;
  areas: AreaMonitor[];
  diagnosis: Array<{ level: "attention" | "watch" | "steady"; title: string; evidence: string }>;
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
          { label: "학습 세션", value: `${challengeSessions.length}개` },
          { label: "독립 성공", value: `${independentSuccesses}/${evidenceCount}` },
          { label: "미해결 오답", value: `${unresolvedChallenge.length}개` }
        ],
        detail: challengeSessions.length > 0 ? "문장 구조 학습과 AI 비계 사용 기록을 확인합니다." : "아직 오늘의 챌린지 학습 기록이 없습니다."
      },
      {
        id: "self-study",
        label: "스스로 유형학습",
        ...selfStudyState,
        lastSeenAt: selfStudyLastSeen,
        metrics: [
          { label: "완료한 하루", value: `${dailyCompletions.length}일` },
          { label: "학습 세션", value: `${selfStudySessions.length}개` },
          { label: "미해결 오답", value: `${unresolvedSelfStudy.length}개` }
        ],
        detail: dailyCompletions.length > 0 ? "일일 학습 완료와 유형 활동 기록을 확인합니다." : "아직 완료한 스스로 유형학습이 없습니다."
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
        detail: unresolvedAll.length > 0 ? "반복 횟수가 높은 문제부터 다시 살펴볼 필요가 있습니다." : "현재 남아 있는 미해결 오답이 없습니다."
      }
    ],
    diagnosis: diagnosis.slice(0, 3)
  };
}
