import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { grammarDiagnosticQuestions } from "../src/lib/diagnosis/grammar-diagnostic.ts";
import {
  addCalendarDays,
  buildDailyRoadmap,
  calculateDailyStreak,
  getDailyPracticePlan,
  getRecentSevenDays,
  getSelectablePracticeDate
} from "../src/lib/learning/daily-practice.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P1·P3·P6: 다섯 유형은 5일마다 모두 나오되 날짜 기반 복불복 순서로 안정적으로 섞인다", () => {
  const firstDates = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"];
  const secondDates = ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"];
  const firstBlock = firstDates.map((date) => getDailyPracticePlan(date).type);
  const secondBlock = secondDates.map((date) => getDailyPracticePlan(date).type);
  const expectedTypes = ["authentic", "concept-learning", "error-correction", "literature", "sentence-making"];
  assert.deepEqual([...firstBlock].sort(), expectedTypes);
  assert.deepEqual([...secondBlock].sort(), expectedTypes);
  assert.notDeepEqual(firstBlock, secondBlock);
  assert.deepEqual(firstBlock, firstDates.map((date) => getDailyPracticePlan(date).type));

  const conceptIds = Array.from({ length: 40 }, (_, index) => getDailyPracticePlan(addCalendarDays("2026-10-01", index)))
    .filter((plan) => plan.type === "concept-learning")
    .map((plan) => plan.materialId)
    .sort();
  assert.deepEqual(conceptIds, grammarDiagnosticQuestions.map((question) => question.id).sort());
});

test("P2·P4: 30일 로드맵은 지난 14일·오늘·앞으로 15일을 구분한다", () => {
  const roadmap = buildDailyRoadmap("2026-10-05", ["2026-10-03", "2026-10-04"], ["2026-10-03"]);
  assert.equal(roadmap.length, 30);
  assert.equal(roadmap[0].date, "2026-09-21");
  assert.equal(roadmap[14].status, "today");
  assert.equal(roadmap[29].date, "2026-10-20");
  assert.deepEqual(roadmap.slice(12, 16).map((day) => day.status), ["completed-late", "completed", "today", "locked"]);
  assert.equal(getSelectablePracticeDate("2026-09-21", "2026-10-05"), "2026-09-21");
  assert.equal(getSelectablePracticeDate("2026-10-06", "2026-10-05"), "2026-10-05");
  assert.equal(getSelectablePracticeDate("2026-09-20", "2026-10-05"), "2026-10-05");
});

test("P5: 연속 학습은 오늘 또는 어제부터 끊기지 않은 날짜만 센다", () => {
  assert.equal(calculateDailyStreak(["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"], "2026-10-05"), 4);
  assert.equal(calculateDailyStreak(["2026-10-02", "2026-10-03", "2026-10-04"], "2026-10-05"), 3);
  assert.equal(calculateDailyStreak(["2026-10-01", "2026-10-03"], "2026-10-05"), 0);
  assert.equal(getRecentSevenDays("2026-10-05", ["2026-10-05"]).filter((day) => day.completed).length, 1);
});

test("DATA·PRIVACY: 완료 API는 로그인 사용자와 소유 세션을 확인하고 기존 RLS 이벤트에 기록한다", () => {
  const route = read("src/app/api/daily-practice/route.ts");
  const rls = read("supabase/migrations/202609230001_initial_schema.sql");
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /\.eq\("user_id", auth\.user\.id\)/);
  assert.match(route, /본인의 학습 세션만 완료 처리할 수 있습니다/);
  assert.match(route, /event_type: "daily_practice_completed"/);
  assert.match(route, /practiceDate < today/);
  assert.match(route, /calculateDailyStreak\(onTimeCompletionDates, today\)/);
  assert.match(route, /\.select\("metadata, created_at"\)/);
  assert.doesNotMatch(route, /service_role|createAdmin/);
  assert.match(rls, /events_read_owner_or_teacher/);
  assert.match(rls, /events_insert_owner/);
});
