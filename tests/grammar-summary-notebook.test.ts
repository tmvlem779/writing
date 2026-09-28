import assert from "node:assert/strict";
import test from "node:test";
import {
  getGrammarSummaryFeedback,
  grammarSummarySections,
  isGrammarSummaryAnswerCorrect
} from "../src/lib/curriculum/grammar-summary-notebook.ts";

test("P3·P4: 6차시 정리 노트는 문장 구조와 문법 요소를 함께 다룬다", () => {
  assert.deepEqual(grammarSummarySections.map((section) => section.title), ["문장의 구조", "문법 요소"]);
  const blanks = grammarSummarySections.flatMap((section) => section.blanks);
  assert.equal(blanks.length, 17);
  assert.ok(blanks.every((blank) => blank.answers.length > 0 && blank.hint.length > 10 && blank.syllableCount > 0));

  const topics = blanks.map((blank) => blank.topic).join(" ");
  for (const topic of ["이어진문장", "안긴절", "종결", "높임", "시간", "피동", "사동", "부정", "인용"]) {
    assert.match(topics, new RegExp(topic));
  }
});

test("P2·P3: 입력 답은 띄어쓰기와 인용 부호 차이를 허용하되 오답은 통과시키지 않는다", () => {
  const connectedMarker = grammarSummarySections[0].blanks[0];
  const subjectHonorific = grammarSummarySections[1].blanks[1];

  assert.equal(isGrammarSummaryAnswerCorrect(connectedMarker, "연결어미"), true);
  assert.equal(isGrammarSummaryAnswerCorrect(subjectHonorific, "‘-(으)시-’"), true);
  assert.equal(isGrammarSummaryAnswerCorrect(connectedMarker, "연결 조사"), false);
  assert.equal(isGrammarSummaryAnswerCorrect(connectedMarker, ""), false);
});

test("P1·P3: 오답용 힌트는 빈칸 답 대신 관찰 단서를 제공한다", () => {
  for (const blank of grammarSummarySections.flatMap((section) => section.blanks)) {
    assert.ok(blank.hint.endsWith("요."));
    assert.notEqual(blank.hint.trim(), blank.answers[0]);
  }
});

test("P1·P3: 각 칸은 제출 전 힌트를 숨기고 제출한 오답에만 개별 힌트를 제공한다", () => {
  const firstBlank = grammarSummarySections[0].blanks[0];
  const secondBlank = grammarSummarySections[0].blanks[1];

  assert.equal(getGrammarSummaryFeedback(firstBlank, "연결 조사", false), null);
  assert.deepEqual(getGrammarSummaryFeedback(firstBlank, "연결 조사", true), {
    kind: "retry",
    message: `${firstBlank.hint} 정답의 음절 수는 4음절이에요.`
  });
  assert.equal(getGrammarSummaryFeedback(secondBlank, "", true), null);
  assert.deepEqual(getGrammarSummaryFeedback(firstBlank, "연결 어미", true), {
    kind: "correct",
    message: "맞게 정리했어요."
  });
});

test("P1·P3: 모든 오답 힌트는 목표 답의 음절 수를 함께 제공한다", () => {
  for (const blank of grammarSummarySections.flatMap((section) => section.blanks)) {
    const primaryAnswerSyllables = blank.answers[0].match(/[가-힣]/g)?.length ?? 0;
    assert.equal(blank.syllableCount, primaryAnswerSyllables);
    const feedback = getGrammarSummaryFeedback(blank, "오답", true);
    assert.equal(feedback?.kind, "retry");
    assert.match(feedback?.message ?? "", new RegExp(`정답의 음절 수는 ${blank.syllableCount}음절`));
  }
});
