import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { activitySchema } from "../src/lib/agent/schema.ts";
import { buildFallbackResponse } from "../src/lib/agent/fallback.ts";
import {
  buildRealLifeTask,
  realLifeMaterials,
  realLifePracticeModes
} from "../src/lib/curriculum/real-life-materials.ts";

test("P6: 챕터 3은 여섯 종류의 실제적 언어 자료를 모두 제공한다", () => {
  assert.deepEqual(
    realLifeMaterials.map((material) => material.id),
    ["article", "notice", "dialogue", "presentation", "interview", "social"]
  );
  assert.ok(realLifeMaterials.every((material) => material.sourceNote === "수업용 재구성 자료"));
});

test("P3·P4·P6: 모든 자료는 구조, 효과, 고쳐 쓰기 과제를 제공한다", () => {
  assert.deepEqual(realLifePracticeModes.map((mode) => mode.id), ["structure", "effect", "rewrite"]);
  for (const material of realLifeMaterials) {
    assert.ok(material.focusConcepts.length >= 2);
    assert.ok(buildRealLifeTask(material, "structure").length > 10);
    assert.ok(buildRealLifeTask(material, "effect").length > 10);
    assert.ok(buildRealLifeTask(material, "rewrite").length > 10);
  }
});

test("P6: 실생활 자료 활동은 서버 입력 스키마와 비계 응답에 연결된다", () => {
  assert.equal(activitySchema.parse("authentic"), "authentic");
  const response = buildFallbackResponse({
    sessionId: "demo-session",
    activity: "authentic",
    message: "기사의 첫 문장은 원인과 결과가 연결되어 있습니다.",
    scaffoldLevel: 0,
    attemptCount: 0,
    history: []
  });
  assert.match(response.question, /목적과 독자|효과/);
  assert.equal(response.nextAction, "transfer");
});

test("PRIVACY: 수업용 자료에는 연락처나 실제 계정 표기가 없다", () => {
  const combined = realLifeMaterials.map((material) => material.content).join("\n");
  assert.doesNotMatch(combined, /@|\b01[016789]-?\d{3,4}-?\d{4}\b/);
});

test("DATA: 운영 마이그레이션은 실생활 활동과 프롬프트 v2를 허용한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609250001_add_authentic_language_activity.sql", "utf8");
  assert.match(migration, /'authentic'/);
  assert.match(migration, /'writing-tutor-v2'/);
});
