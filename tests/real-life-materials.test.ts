import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { activitySchema } from "../src/lib/agent/schema.ts";
import { buildFallbackResponse } from "../src/lib/agent/fallback.ts";
import { removeTrustedCurriculumPassages } from "../src/lib/safety/moderation.ts";
import {
  buildRealLifeTask,
  grammarRealLifeMaterials,
  getRealLifeMaterialGroup,
  getRealLifeMaterialsForLesson,
  realLifeMaterials,
  realLifeLessonGuides,
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

test("P6: 5차시는 1~4차시 관점과 세 단계 실생활 과제를 통합한다", () => {
  assert.equal(realLifeLessonGuides.length, 1);
  assert.equal(realLifeLessonGuides[0].lessonNumber, 5);
  assert.equal(realLifeLessonGuides[0].reviewPrompts.length, 4);
  const materials = getRealLifeMaterialsForLesson(5);
  assert.equal(materials.length, 6);
  for (const material of materials) {
    for (const mode of realLifePracticeModes) {
      assert.ok(buildRealLifeTask(material, mode.id).length > 20);
    }
  }
});

test("P6: 현재 여섯 차시 수업의 실생활 자료 원본은 나중의 재사용을 위해 보존한다", () => {
  assert.equal(getRealLifeMaterialsForLesson(5, "grammar").length, 0);
  const materials = getRealLifeMaterialsForLesson(6, "grammar");
  assert.equal(materials.length, 10);
  assert.equal(grammarRealLifeMaterials.length, 10);
});

test("P3·P4·P6: 문학 작품은 시·소설을 각각 두 편씩 제공한다", () => {
  const literature = getRealLifeMaterialsForLesson(6, "grammar", "literature");
  assert.equal(literature.length, 4);
  assert.equal(literature.filter((material) => material.genre === "시").length, 2);
  assert.equal(literature.filter((material) => material.genre === "소설").length, 2);
  assert.ok(literature.every((material) => getRealLifeMaterialGroup(material) === "literature"));
  assert.ok(literature.every((material) => /저작권 보호기간 만료/.test(material.sourceNote)));
  assert.ok(literature.every((material) => (material.selectableSentences?.length ?? 0) >= 4));
  assert.ok(literature.every((material) => material.content.length >= 100));
  assert.ok(literature.filter((material) => material.genre === "소설").every((material) => (material.selectableSentences?.length ?? 0) >= 10));
  assert.ok(literature.every((material) => material.analysisPrompts.length === 2));
  assert.ok(literature.every((material) => material.rewritePrompt.length > 20));
});

test("P6: 실생활 탭은 여섯 자료만 문학 작품과 분리한다", () => {
  const authentic = getRealLifeMaterialsForLesson(6, "grammar", "authentic");
  assert.deepEqual(authentic.map((material) => material.id), ["article", "notice", "dialogue", "presentation", "interview", "social"]);
  assert.ok(authentic.every((material) => getRealLifeMaterialGroup(material) === "authentic"));
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

test("P3·P5: 문학 겹문장 다중 선택은 정답 공개 대신 선택 근거 질문으로 이어진다", () => {
  const response = buildFallbackResponse({
    sessionId: "demo-session",
    activity: "authentic",
    message: "[첫 과제] 작품에서 겹문장을 찾아 모두 고르시오.\n[학생이 겹문장으로 고른 문장들]\n1. 산으로 올라서려니까 닭의 횃소리가 야단이다.",
    scaffoldLevel: 0,
    attemptCount: 0,
    history: []
  });
  assert.match(response.question, /주어·서술어 관계/);
  assert.match(response.question, /왜 겹문장/);
  assert.deepEqual(response.focusConcepts, ["홑문장·겹문장", "주어·서술어 관계", "절의 경계"]);
});

test("SAFE: 고정 문학 본문은 안전 검사에서 제외하되 학생 작성 내용은 남긴다", () => {
  const trustedPoem = "나 보기가 역겨워 가실 때에는\n죽어도 아니 눈물 흘리오리다.";
  const input = `[자료 본문]\n${trustedPoem}\n\n[학생 답]\n제가 쓴 답은 반드시 검사되어야 합니다.`;
  const result = removeTrustedCurriculumPassages(input, [trustedPoem]);

  assert.doesNotMatch(result, /죽어도 아니 눈물/);
  assert.match(result, /제가 쓴 답은 반드시 검사되어야 합니다/);
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
