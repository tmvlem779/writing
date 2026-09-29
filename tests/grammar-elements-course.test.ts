import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  courseTracks,
  getCourseLesson,
  grammarSixLessonCourse
} from "../src/lib/curriculum/five-lesson-course.ts";
import {
  evaluateGrammarConceptCheck,
  grammarElementLessons,
  grammarElementsSource
} from "../src/lib/curriculum/grammar-elements.ts";
import {
  buildRealLifeTask,
  getRealLifeLessonGuide,
  getRealLifeMaterialsForLesson,
  grammarRealLifeMaterials,
  realLifePracticeModes
} from "../src/lib/curriculum/real-life-materials.ts";

test("CURRICULUM: 학생 화면에는 구조+문법 요소 여섯 차시만 제공한다", () => {
  assert.equal(courseTracks.length, 1);
  assert.deepEqual(courseTracks.map((track) => track.id), ["grammar"]);
  assert.equal(grammarSixLessonCourse.length, 6);
  assert.equal(getCourseLesson(1).title, "문장의 기본 구조와 문장 생성");
  assert.equal(getCourseLesson(1, "grammar").title, "문장의 기본 구조와 문장 생성");
});

test("CURRICULUM: 새 수업안은 요청한 여섯 차시를 순서대로 제공한다", () => {
  assert.deepEqual(grammarSixLessonCourse.map((lesson) => lesson.title), [
    "문장의 기본 구조와 문장 생성",
    "이어진문장과 의미 관계",
    "안은문장과 문장 확대",
    "종결·높임·시간 표현",
    "피동·사동·부정·인용 표현",
    "구조와 문법 요소의 종합적 활용"
  ]);
  assert.ok(grammarSixLessonCourse.every((lesson) => lesson.keyQuestion.endsWith("?")));
  assert.ok(grammarSixLessonCourse.every((lesson) => lesson.practiceActivities.length >= 4));
});

test("P3·P4: 교과서 범위와 문법 요소를 개념 학습에 반영한다", () => {
  assert.equal(grammarElementsSource.section, "문장의 구조와 문법 요소");
  assert.equal(grammarElementsSource.pages, "86~111쪽");
  assert.equal(grammarElementLessons.length, 6);
  for (const lesson of grammarSixLessonCourse) {
    assert.ok(grammarElementLessons.some((concept) => concept.id === lesson.conceptLessonId));
  }
  const fourth = grammarElementLessons.find((lesson) => lesson.id === "grammar-ending-honor-time");
  const fifth = grammarElementLessons.find((lesson) => lesson.id === "grammar-voice-negation-quotation");
  const fourthContent = [fourth?.summary, ...(fourth?.conceptSections?.flatMap((section) => [section.title, ...section.points]) ?? [])].join(" ");
  const fifthContent = [fifth?.summary, ...(fifth?.conceptSections?.flatMap((section) => [section.title, ...section.points]) ?? [])].join(" ");
  for (const element of ["종결", "높임", "시간"]) {
    assert.match(fourthContent, new RegExp(element));
  }
  for (const element of ["피동", "사동", "부정", "인용"]) {
    assert.match(fifthContent, new RegExp(element));
  }
});

test("P3: 모든 차시는 세분화된 개념과 세 문항 이상의 자기 확인을 제공한다", () => {
  for (const lesson of grammarElementLessons) {
    assert.ok((lesson.conceptSections?.length ?? 0) >= 3);
    assert.ok(lesson.conceptSections?.every((section) => section.points.length >= 3));
    assert.ok(1 + (lesson.extraChecks?.length ?? 0) >= 3);
    for (const check of [lesson.check, ...(lesson.extraChecks ?? [])]) {
      assert.equal(check.options.filter((option) => option.id === check.answer).length, 1);
      assert.ok(check.retryHint);
    }
  }
});

test("P3: 문법 요소 개념 확인도 오답에서 정답을 먼저 공개하지 않는다", () => {
  const incorrect = evaluateGrammarConceptCheck("grammar-voice-negation-quotation", "voice-choice");
  const correct = evaluateGrammarConceptCheck("grammar-voice-negation-quotation", "voice-ability");
  assert.equal(incorrect?.correct, false);
  assert.equal(correct?.correct, true);
  assert.equal(incorrect?.reflection, correct?.reflection);
});

test("P4·P6: 4·5차시는 문법 요소를 나누고 6차시는 생성·변형·설명을 요구한다", () => {
  const fourth = getCourseLesson(4, "grammar");
  const fourthLabels = fourth.practiceActivities.map((activity) => activity.label).join(" ");
  for (const element of ["종결", "높임", "시간"]) {
    assert.match(fourthLabels, new RegExp(element));
  }
  const fifthLabels = getCourseLesson(5, "grammar").practiceActivities.map((activity) => activity.label).join(" ");
  for (const element of ["피동", "사동", "부정", "인용"]) {
    assert.match(fifthLabels, new RegExp(element));
  }
  const finalPrompts = getCourseLesson(6, "grammar").practiceActivities.map((activity) => activity.prompt).join(" ");
  assert.match(finalPrompts, /친구 대화용/);
  assert.match(finalPrompts, /학교 공식 안내용/);
  assert.match(finalPrompts, /선택 이유/);
});

test("P6·PRIVACY: 6차시 챕터 3은 숨기되 실생활 자료는 나중의 재사용을 위해 보존한다", () => {
  assert.deepEqual(getCourseLesson(5, "grammar").realLifeMaterialIds, []);
  assert.deepEqual(getCourseLesson(6, "grammar").realLifeMaterialIds, []);
  assert.equal(getRealLifeMaterialsForLesson(4, "grammar").length, 0);
  assert.equal(getRealLifeMaterialsForLesson(5, "grammar").length, 0);
  assert.equal(getRealLifeMaterialsForLesson(6, "grammar").length, 7);
  assert.equal(getRealLifeLessonGuide("grammar").lessonNumber, 6);
  assert.equal(getRealLifeLessonGuide("grammar").reviewPrompts.length, 5);
  assert.deepEqual(grammarRealLifeMaterials.map((material) => material.id), ["article", "notice", "dialogue", "presentation", "interview", "social", "literature"]);
  for (const material of grammarRealLifeMaterials) {
    assert.doesNotMatch(material.content, /@|\b01[016789]-?\d{3,4}-?\d{4}\b/);
    for (const mode of realLifePracticeModes) {
      assert.ok(buildRealLifeTask(material, mode.id).length > 20);
    }
  }
});

test("DATA: 두 수업안을 구분하는 프롬프트 v4 마이그레이션이 존재한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609260001_add_grammar_course_prompt.sql", "utf8");
  assert.match(migration, /writing-tutor-v4/);
  assert.match(migration, /grammar-elements-course/);
});

test("DATA: 별도 날개 활동과 상세 개념을 반영한 프롬프트 v5 마이그레이션이 존재한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609260002_add_grammar_wing_prompt.sql", "utf8");
  assert.match(migration, /writing-tutor-v5/);
  assert.match(migration, /grammar-wing-expanded-concepts/);
});

test("DATA: 여섯 차시 통합 구성을 반영한 프롬프트 v6 마이그레이션이 존재한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609280001_add_six_lesson_grammar_prompt.sql", "utf8");
  assert.match(migration, /writing-tutor-v6/);
  assert.match(migration, /six-lesson-grammar-course/);
});

test("DATA: 단일 수업안과 정리 노트를 반영한 프롬프트 v7 마이그레이션이 존재한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609280002_add_single_course_summary_prompt.sql", "utf8");
  assert.match(migration, /writing-tutor-v7/);
  assert.match(migration, /single-course-summary-notebook/);
});
