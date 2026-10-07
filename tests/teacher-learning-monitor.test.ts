import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildStudentLearningMonitor } from "../src/lib/teacher/learning-monitor.ts";

const read = (path: string) => fs.readFileSync(path, "utf8");

test("TEACHER: 학생별 현황은 세 학습 영역을 분리해 제공한다", () => {
  const monitor = buildStudentLearningMonitor({
    userId: "student-1",
    name: "김문득",
    loginId: "student01",
    now: new Date("2026-10-06T12:00:00+09:00"),
    sessions: [
      { id: "challenge-session", activityType: "create", status: "active", updatedAt: "2026-10-06T11:58:00+09:00" },
      { id: "self-session", activityType: "authentic", status: "completed", updatedAt: "2026-10-05T10:00:00+09:00" }
    ],
    concepts: [{ conceptCode: "create", scaffoldLevel: 2, evidenceCount: 3, independentSuccessCount: 2 }],
    events: [
      { sessionId: "challenge-session", eventType: "area_started", conceptCode: "challenge", metadata: { learningArea: "challenge" }, createdAt: "2026-10-06T11:58:00+09:00" },
      { sessionId: "self-session", eventType: "area_started", conceptCode: "self-study", metadata: { learningArea: "self-study" }, createdAt: "2026-10-05T10:00:00+09:00" },
      { sessionId: "self-session", eventType: "daily_practice_completed", conceptCode: "daily_practice", metadata: {}, createdAt: "2026-10-05T10:10:00+09:00" }
    ],
    wrongAnswers: []
  });

  assert.deepEqual(monitor.areas.map((area) => area.label), ["오늘의 챌린지", "스스로 유형학습", "오답노트"]);
  assert.equal(monitor.areas[0].state, "studying");
  assert.equal(monitor.areas[0].metrics[0].value, "1개");
  assert.equal(monitor.areas[1].metrics[0].value, "1일");
});

test("P1·P5: 반복 오답과 높은 비계 사용을 정체 근거로 진단한다", () => {
  const monitor = buildStudentLearningMonitor({
    userId: "student-2",
    name: "이문득",
    loginId: "student02",
    sessions: [{ id: "session", activityType: "expand", status: "active", updatedAt: "2026-10-06T09:00:00+09:00" }],
    concepts: [{ conceptCode: "expand", scaffoldLevel: 3, evidenceCount: 4, independentSuccessCount: 1 }],
    events: [],
    wrongAnswers: [{
      source: "challenge",
      sourceLabel: "오늘의 챌린지",
      problemTitle: "안은문장",
      attemptCount: 3,
      resolvedAt: null,
      updatedAt: "2026-10-06T09:10:00+09:00"
    }]
  });

  assert.match(monitor.diagnosis[0].title, /반복해 막히고/);
  assert.match(monitor.diagnosis[0].evidence, /3회/);
  assert.ok(monitor.diagnosis.some((item) => item.evidence.includes("부분 구조")));
  assert.equal(monitor.areas[0].state, "needs-review");
});

test("TEACHER·PRIVACY: 교사 모니터는 담당 학생 데이터와 자동 갱신을 사용한다", () => {
  const page = read("src/app/teacher/page.tsx");
  const component = read("src/components/student-learning-monitor.tsx");
  const sessionRoute = read("src/app/api/sessions/route.ts");
  const practice = read("src/components/practice-chapter.tsx");
  const dailyConcept = read("src/components/concept-learning-activity.tsx");

  assert.match(page, /StudentLearningMonitor/);
  assert.match(page, /\.in\("user_id", studentIds\)/);
  assert.match(page, /getUserById\(userId\)/);
  assert.match(component, /role="tablist"/);
  assert.match(component, /오늘의 챌린지|student\.areas/);
  assert.match(component, /15_000/);
  assert.match(component, /router\.refresh\(\)/);
  assert.match(sessionRoute, /event_type: "area_started"/);
  assert.match(sessionRoute, /learningArea: z\.enum\(\["challenge", "self-study"\]\)/);
  assert.match(practice, /learningArea: "challenge"/);
  assert.match(dailyConcept, /learningArea: "self-study"/);
});

test("RESPONSIVE: 교사 학습 현황은 태블릿과 모바일에서 열 수를 줄인다", () => {
  const styles = read("src/app/globals.css");

  assert.match(styles, /@media \(min-width: 641px\) and \(max-width: 1024px\)[\s\S]*\.metric-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(min-width: 641px\) and \(max-width: 1024px\)[\s\S]*\.student-area-panel \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.student-area-summary dl \{ grid-template-columns: 1fr; \}/);
});
