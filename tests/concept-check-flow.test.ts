import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceConceptCheck,
  canAdvanceConceptCheck,
  isConceptCheckComplete
} from "../src/lib/curriculum/concept-check-flow.ts";

test("P1·P3: 현재 문항을 통과하기 전에는 다음 문항으로 갈 수 없다", () => {
  assert.equal(canAdvanceConceptCheck(0, 3, []), false);
  assert.equal(advanceConceptCheck(0, 3, []), 0);
});

test("P1·P3: 현재 문항의 정답을 맞힌 뒤에만 바로 다음 문항이 열린다", () => {
  assert.equal(canAdvanceConceptCheck(0, 3, [0]), true);
  assert.equal(advanceConceptCheck(0, 3, [0]), 1);
  assert.equal(canAdvanceConceptCheck(1, 3, [0]), false);
});

test("P3: 모든 문항을 순서대로 통과해야 개념 확인이 완료된다", () => {
  assert.equal(isConceptCheckComplete(3, [0, 1]), false);
  assert.equal(isConceptCheckComplete(3, [0, 1, 2]), true);
});
