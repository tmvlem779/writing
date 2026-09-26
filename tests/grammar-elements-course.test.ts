import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  courseTracks,
  fiveLessonCourse,
  getCourseLesson,
  grammarFiveLessonCourse
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

test("CURRICULUM: 기존 구조 중심안과 새 구조+문법 요소안을 별도로 보존한다", () => {
  assert.equal(courseTracks.length, 2);
  assert.deepEqual(courseTracks.map((track) => track.id), ["structure", "grammar"]);
  assert.equal(fiveLessonCourse.length, 5);
  assert.equal(grammarFiveLessonCourse.length, 5);
  assert.notStrictEqual(fiveLessonCourse, grammarFiveLessonCourse);
  assert.equal(getCourseLesson(1, "structure").title, "문장의 짜임과 홑문장·겹문장");
  assert.equal(getCourseLesson(1, "grammar").title, "문장의 기본 구조와 문장 생성");
});

test("CURRICULUM: 새 수업안은 요청한 다섯 차시를 순서대로 제공한다", () => {
  assert.deepEqual(grammarFiveLessonCourse.map((lesson) => lesson.title), [
    "문장의 기본 구조와 문장 생성",
    "이어진문장과 의미 관계",
    "안은문장과 문장 확대",
    "문법 요소와 의미 변화",
    "구조와 문법 요소의 종합적 활용"
  ]);
  assert.ok(grammarFiveLessonCourse.every((lesson) => lesson.keyQuestion.endsWith("?")));
  assert.ok(grammarFiveLessonCourse.every((lesson) => lesson.practiceActivities.length >= 4));
});

test("P3·P4: 교과서 범위와 문법 요소를 개념 학습에 반영한다", () => {
  assert.equal(grammarElementsSource.section, "문장의 구조와 문법 요소");
  assert.equal(grammarElementsSource.pages, "86~111쪽");
  assert.equal(grammarElementLessons.length, 5);
  for (const lesson of grammarFiveLessonCourse) {
    assert.ok(grammarElementLessons.some((concept) => concept.id === lesson.conceptLessonId));
  }
  const grammarLesson = grammarElementLessons.find((lesson) => lesson.id === "grammar-meaning-change");
  const content = [grammarLesson?.summary, ...(grammarLesson?.keyPoints ?? []), ...(grammarLesson?.examples.map((item) => item.note) ?? [])].join(" ");
  for (const element of ["시간", "높임", "피동", "사동", "부정"]) {
    assert.match(content, new RegExp(element));
  }
});

test("P3: 문법 요소 개념 확인도 오답에서 정답을 먼저 공개하지 않는다", () => {
  const incorrect = evaluateGrammarConceptCheck("grammar-meaning-change", "choice");
  const correct = evaluateGrammarConceptCheck("grammar-meaning-change", "ability");
  assert.equal(incorrect?.correct, false);
  assert.equal(correct?.correct, true);
  assert.equal(incorrect?.reflection, correct?.reflection);
});

test("P4·P6: 4차시는 의미 변화, 5차시는 담화 맥락의 종합 활용을 요구한다", () => {
  const fourth = getCourseLesson(4, "grammar");
  const labels = fourth.practiceActivities.map((activity) => activity.label).join(" ");
  for (const element of ["시간", "높임", "피동·사동", "부정", "의미 변화"]) {
    assert.match(labels, new RegExp(element));
  }
  const finalPrompts = getCourseLesson(5, "grammar").practiceActivities.map((activity) => activity.prompt).join(" ");
  assert.match(finalPrompts, /친구 대화용/);
  assert.match(finalPrompts, /학교 공식 안내용/);
  assert.match(finalPrompts, /선택 이유/);
});

test("P6·PRIVACY: 새 종합 장은 문법 요소를 담은 여섯 재구성 자료를 사용한다", () => {
  assert.equal(getRealLifeMaterialsForLesson(4, "grammar").length, 0);
  assert.equal(getRealLifeMaterialsForLesson(5, "grammar").length, 6);
  assert.equal(getRealLifeLessonGuide("grammar").reviewPrompts.length, 4);
  assert.deepEqual(grammarRealLifeMaterials.map((material) => material.id), ["article", "notice", "dialogue", "presentation", "interview", "social"]);
  for (const material of grammarRealLifeMaterials) {
    assert.doesNotMatch(material.content, /@|\b01[016789]-?\d{3,4}-?\d{4}\b/);
    for (const mode of realLifePracticeModes) {
      assert.ok(buildRealLifeTask(material, mode.id, "grammar").length > 20);
    }
  }
});

test("DATA: 두 수업안을 구분하는 프롬프트 v4 마이그레이션이 존재한다", () => {
  const migration = fs.readFileSync("supabase/migrations/202609260001_add_grammar_course_prompt.sql", "utf8");
  assert.match(migration, /writing-tutor-v4/);
  assert.match(migration, /grammar-elements-course/);
});
