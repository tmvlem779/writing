import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateConceptCheck,
  sentenceStructureLessons,
  sentenceStructureSource
} from "../src/lib/curriculum/sentence-structure.ts";

test("P3·P4: 개념 학습은 관찰에서 표현 효과까지 순서대로 진행한다", () => {
  assert.deepEqual(
    sentenceStructureLessons.map((lesson) => lesson.id),
    ["sentence-and-clause", "connected-sentences", "embedded-basic", "embedded-advanced-effect", "synthesis-generation"]
  );
  assert.equal(sentenceStructureSource.section, "문장의 구조");
  assert.equal(sentenceStructureSource.pages, "88~95쪽");
});

test("P3: 모든 개념 단계는 질문과 선택 전 비노출 정답을 가진다", () => {
  for (const lesson of sentenceStructureLessons) {
    assert.ok(lesson.inquiryQuestion.endsWith("?") || lesson.inquiryQuestion.endsWith("보세요."));
    assert.ok(lesson.check.options.length >= 3);
    assert.equal(lesson.check.options.filter((option) => option.id === lesson.check.answer).length, 1);
    assert.ok(lesson.check.reflection.length > 0);
  }
});

test("P4: 안은문장 단계는 다섯 가지 안긴절을 모두 다룬다", () => {
  const embeddedLessons = sentenceStructureLessons.filter((lesson) => lesson.id.startsWith("embedded-"));
  assert.equal(embeddedLessons.length, 2);
  const notes = embeddedLessons.flatMap((lesson) => lesson.examples).map((example) => example.note).join(" ");
  for (const clauseType of ["명사절", "관형절", "부사절", "서술절", "인용절"]) {
    assert.match(notes, new RegExp(clauseType));
  }
});

test("P3: 오답에는 정답을 먼저 공개하지 않고 다시 관찰하게 한다", () => {
  const incorrect = evaluateConceptCheck("connected-sentences", "coordinate");
  const correct = evaluateConceptCheck("connected-sentences", "subordinate");
  assert.equal(incorrect?.correct, false);
  assert.equal(correct?.correct, true);
  assert.equal(incorrect?.reflection, correct?.reflection);
});
