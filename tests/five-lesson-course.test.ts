import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fiveLessonCourse, getCourseLesson } from "../src/lib/curriculum/five-lesson-course.ts";
import { sentenceStructureLessons } from "../src/lib/curriculum/sentence-structure.ts";
import { getRealLifeMaterialsForLesson } from "../src/lib/curriculum/real-life-materials.ts";

test("CURRICULUM: 다섯 차시는 제시된 핵심 내용과 핵심 질문을 순서대로 갖는다", () => {
  assert.equal(fiveLessonCourse.length, 5);
  assert.deepEqual(fiveLessonCourse.map((lesson) => lesson.number), [1, 2, 3, 4, 5]);
  assert.deepEqual(fiveLessonCourse.map((lesson) => lesson.title), [
    "문장의 짜임과 홑문장·겹문장",
    "이어진문장",
    "안은문장 ①",
    "안은문장 ②와 문장 구조·의미",
    "문장 생성과 종합 활동"
  ]);
  assert.ok(fiveLessonCourse.every((lesson) => lesson.keyQuestion.endsWith("?")));
});

test("P2·P3·P4·P5: 모든 차시는 개념과 쓰기 활동을 가진다", () => {
  for (const lesson of fiveLessonCourse) {
    assert.ok(sentenceStructureLessons.some((concept) => concept.id === lesson.conceptLessonId));
    assert.ok(lesson.practiceActivities.length >= 4);
    assert.ok(lesson.practiceActivities.every((activity) => activity.prompt.length > 20));
  }
});

test("P6: 실생활 탐구는 5차시에만 제공되고 여섯 자료를 모두 통합한다", () => {
  for (const lessonNumber of [1, 2, 3, 4] as const) {
    assert.equal(getRealLifeMaterialsForLesson(lessonNumber).length, 0);
    assert.deepEqual(getCourseLesson(lessonNumber).realLifeMaterialIds, []);
  }
  assert.equal(getRealLifeMaterialsForLesson(5).length, 6);
  assert.equal(getCourseLesson(5).realLifeMaterialIds.length, 6);
});

test("P3·P6: 5차시는 생성·자기 설명·상호 피드백·종합 평가를 포함한다", () => {
  const finalLesson = getCourseLesson(5);
  const labels = finalLesson.practiceActivities.map((activity) => activity.label).join(" ");
  for (const expected of ["조건 문장 생성", "자기 설명", "상호 피드백", "종합 평가"]) {
    assert.match(labels, new RegExp(expected));
  }
});

test("DATA: 다섯 차시 맥락을 반영한 프롬프트 v3 마이그레이션이 존재한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609250002_add_five_lesson_prompt.sql", "utf8");
  assert.match(migration, /writing-tutor-v3/);
  assert.match(migration, /five-lesson-course/);
});
