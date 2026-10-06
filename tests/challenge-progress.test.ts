import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { challengeProgressInputSchema } from "../src/lib/learning/challenge-progress.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("DATA: 오늘의 챌린지는 최소 진행 정보만 검증해 저장한다", () => {
  const result = challengeProgressInputSchema.parse({
    trackId: "grammar",
    lessonNumber: 1,
    conceptCompleted: true,
    completedActivityIds: ["grammar-components"],
    lastChapter: "practice",
    lastActivityId: "grammar-components"
  });
  assert.equal(result.conceptCompleted, true);
  assert.deepEqual(result.completedActivityIds, ["grammar-components"]);
  assert.equal(challengeProgressInputSchema.safeParse({ ...result, lessonNumber: 7 }).success, false);
  assert.equal(challengeProgressInputSchema.safeParse({ ...result, completedActivityIds: ["other student's answer"] }).success, false);
});

test("DATA·PRIVACY: 진행 상황 API는 로그인 사용자를 다시 확인하고 user_id를 서버에서 지정한다", () => {
  const api = read("src/app/api/challenge-progress/route.ts");
  assert.match(api, /supabase\.auth\.getUser\(\)/);
  assert.match(api, /user_id: auth\.user\.id/);
  assert.match(api, /\.eq\("user_id", auth\.user\.id\)/);
  assert.doesNotMatch(api, /userId: input\.data|user_id: input\.data/);
});

test("RLS: 다른 학생의 챌린지 진행을 읽거나 쓰지 못한다", () => {
  const migration = read("supabase/migrations/202610060002_add_challenge_progress.sql");
  const rls = read("supabase/tests/rls.sql");
  assert.match(migration, /alter table public\.challenge_progress enable row level security/);
  assert.match(migration, /user_id = auth\.uid\(\)/);
  assert.match(migration, /private\.is_teacher_of\(user_id\)/);
  assert.match(rls, /student_a can read student_b challenge progress/);
  assert.match(rls, /student_a inserted student_b challenge progress/);
  assert.match(rls, /student_a updated student_b challenge progress/);
});
