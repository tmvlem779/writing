import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildDailyRoadmap,
  calculateDailyStreak,
  getDailyPracticePlan,
  getRecentSevenDays
} from "../src/lib/learning/daily-practice.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("P3·P6: 문학·실생활·문장 만들기가 날짜마다 차례로 순환한다", () => {
  assert.equal(getDailyPracticePlan("2026-10-01").type, "literature");
  assert.equal(getDailyPracticePlan("2026-10-02").type, "authentic");
  assert.equal(getDailyPracticePlan("2026-10-03").type, "sentence-making");
  assert.equal(getDailyPracticePlan("2026-10-04").type, "literature");
  assert.notEqual(getDailyPracticePlan("2026-10-01").materialId, getDailyPracticePlan("2026-10-04").materialId);
});

test("P2·P4: 로드맵은 오늘만 열고 완료·지난 날·미래 날을 구분한다", () => {
  const roadmap = buildDailyRoadmap("2026-10-05", ["2026-10-03", "2026-10-04"]);
  assert.equal(roadmap.length, 7);
  assert.deepEqual(roadmap.map((day) => day.status), ["missed", "completed", "completed", "today", "locked", "locked", "locked"]);
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
  assert.doesNotMatch(route, /service_role|createAdmin/);
  assert.match(rls, /events_read_owner_or_teacher/);
  assert.match(rls, /events_insert_owner/);
});
