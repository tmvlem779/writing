import assert from "node:assert/strict";
import test from "node:test";
import { errorCorrectionItems } from "../src/lib/curriculum/error-correction.ts";
import { grammarDiagnosticQuestions } from "../src/lib/diagnosis/grammar-diagnostic.ts";
import {
  buildWrongNotePractice,
  checkWrongNotePracticeAnswers,
  toPublicWrongNotePractice
} from "../src/lib/learning/wrong-note-practice.ts";

test("P1·P3: 기존 오답과 같은 유형 두 문항을 모두 해결해야 완료할 수 있다", () => {
  const source = grammarDiagnosticQuestions[0];
  const practice = buildWrongNotePractice({
    id: "note-1",
    source: "diagnosis",
    problemId: source.id,
    problemTitle: source.domain,
    question: source.prompt,
    submittedAnswer: source.options[1].label,
    feedbackHint: source.retryHint
  });

  assert.ok(practice);
  assert.equal(practice.questions.length, 3);
  assert.equal(practice.questions[0].prompt, source.prompt);
  assert.equal(checkWrongNotePracticeAnswers(practice, [[source.answer]]), true);
  assert.equal(checkWrongNotePracticeAnswers(practice, [[source.answer], practice.questions[1].correctOptionIds]), true);
  assert.equal(checkWrongNotePracticeAnswers(practice, [
    [source.answer],
    practice.questions[1].correctOptionIds,
    practice.questions[2].correctOptionIds
  ]), true);
  assert.equal(checkWrongNotePracticeAnswers(practice, [[source.options[1].id]]), false);
});

test("PRIVACY: 브라우저에 보내는 오답 연습 문항에는 정답 식별자가 없다", () => {
  const source = grammarDiagnosticQuestions[1];
  const practice = buildWrongNotePractice({
    id: "note-2",
    source: "self-study",
    problemId: `daily-concept-${source.id}`,
    problemTitle: source.domain,
    question: source.prompt,
    submittedAnswer: source.options[0].label,
    feedbackHint: source.retryHint
  });

  assert.ok(practice);
  const publicPractice = toPublicWrongNotePractice(practice);
  assert.doesNotMatch(JSON.stringify(publicPractice), /correctOptionIds/);
});

test("P1·P4: 틀린 문장 고치기 오답도 표시 활동과 유사 문항 두 개로 재구성한다", () => {
  const item = errorCorrectionItems[0];
  const practice = buildWrongNotePractice({
    id: "note-3",
    source: "self-study",
    problemId: `daily-error-${item.id}`,
    problemTitle: item.title,
    question: `${item.tokens.join(" ")}에서 문법적으로 잘못된 부분을 찾으세요.`,
    submittedAnswer: item.tokens[0],
    feedbackHint: item.selectionHint
  });

  assert.ok(practice);
  assert.deepEqual(practice.questions[0].correctOptionIds, item.incorrectTokenIndexes.map(String));
  assert.equal(practice.questions[1].label, "비슷한 유형 1");
  assert.equal(practice.questions[2].label, "비슷한 유형 2");
});
