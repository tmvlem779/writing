import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { activitySchema } from "../src/lib/agent/schema.ts";
import { buildFallbackResponse } from "../src/lib/agent/fallback.ts";
import { resolveOpenAiModel } from "../src/lib/agent/model.ts";
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

test("P3·P5: 소설 전체 문장 표시는 짧은 확인 뒤 다음 문장으로 이어진다", () => {
  const response = buildFallbackResponse({
    sessionId: "demo-session",
    activity: "authentic",
    message: "[첫 과제] 작품의 모든 문장을 차례로 살펴보고, 문장 구조의 단서에 밑줄을 그으시오.\n[학생이 문장 안에서 밑줄 친 연결 표현] 올라서려니까\n[학생이 고른 문장 구조] 둘 이상의 내용\n[학생 답] 산에 올라가려는 일과 닭 우는 소리를 담고 있다.",
    scaffoldLevel: 0,
    attemptCount: 0,
    history: []
  });
  assert.match(response.studentMessage, /둘 이상의 내용/);
  assert.match(response.question, /다음 문장/);
  assert.doesNotMatch(response.question, /주어·서술어|절 경계/);
  assert.deepEqual(response.focusConcepts, ["문장 구조 단서", "홑문장·겹문장", "자기 설명"]);
});

test("P3·P4: 시의 선택은 문법 형태와 표현 효과 질문으로 이어진다", () => {
  const response = buildFallbackResponse({
    sessionId: "demo-session",
    activity: "authentic",
    message: "[첫 과제] 시에서 표현 효과를 만드는 문법 요소가 드러난 구절을 고르시오.\n[학생이 문법 요소 탐구 구절로 고른 부분]\n1. 죽어도 아니 눈물 흘리오리다.",
    scaffoldLevel: 0,
    attemptCount: 0,
    history: []
  });

  assert.match(response.question, /어미|문법 형태/);
  assert.doesNotMatch(response.question, /왜 겹문장/);
  assert.deepEqual(response.focusConcepts, ["종결 표현", "높임·시간·부정 표현", "표현 효과"]);
});

test("P3·P4: 시 자료의 초점 개념은 문법 요소와 표현 효과를 우선한다", () => {
  const poems = getRealLifeMaterialsForLesson(6, "grammar", "literature").filter((material) => material.genre === "시");
  assert.ok(poems.every((material) => material.focusConcepts.some((concept) => /종결 표현/.test(concept))));
  assert.ok(poems.every((material) => material.focusConcepts.every((concept) => !/홑문장|명사절|관형절/.test(concept))));
});

test("SAFE: 고정 문학 본문은 안전 검사에서 제외하되 학생 작성 내용은 남긴다", () => {
  const trustedPoem = "나 보기가 역겨워 가실 때에는\n죽어도 아니 눈물 흘리오리다.";
  const input = `[자료 본문]\n${trustedPoem}\n\n[학생 답]\n제가 쓴 답은 반드시 검사되어야 합니다.`;
  const result = removeTrustedCurriculumPassages(input, [trustedPoem]);

  assert.doesNotMatch(result, /죽어도 아니 눈물/);
  assert.match(result, /제가 쓴 답은 반드시 검사되어야 합니다/);
});

test("AI: 환경 변수의 줄바꿈과 공백을 제거해 지원 모델 이름을 사용한다", () => {
  assert.equal(resolveOpenAiModel("gpt-5.6-luna\r "), "gpt-5.6-luna");
  assert.equal(resolveOpenAiModel("  "), "gpt-5.6-luna");
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
