import assert from "node:assert/strict";
import test from "node:test";
import { nextScaffoldLevel, scaffoldLabel } from "../src/lib/agent/state-machine.ts";

test("P1: 두 번 실패하면 비계를 높인다", () => {
  assert.equal(nextScaffoldLevel({ currentLevel: 1, attemptCount: 2 }), 2);
});

test("P1: 도움 요청 시 비계를 높인다", () => {
  assert.equal(nextScaffoldLevel({ currentLevel: 0, attemptCount: 0, askedForHelp: true }), 1);
});

test("P1: 독립 성공 시 비계를 낮춘다", () => {
  assert.equal(nextScaffoldLevel({ currentLevel: 3, attemptCount: 0, independentSuccess: true }), 2);
});

test("P1: 비계는 0~4 범위를 벗어나지 않는다", () => {
  assert.equal(nextScaffoldLevel({ currentLevel: 4, attemptCount: 5 }), 4);
  assert.equal(nextScaffoldLevel({ currentLevel: 0, attemptCount: 0, independentSuccess: true }), 0);
  assert.equal(scaffoldLabel(4), "직접 설명");
});
