import assert from "node:assert/strict";
import test from "node:test";
import { deriveLearningEvidence } from "../src/lib/agent/learning-evidence.ts";
import type { AgentResponse } from "../src/lib/agent/schema.ts";

function response(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    mode: "question",
    scaffoldLevel: 0,
    studentMessage: "좋아요.",
    question: "근거를 설명해 볼까요?",
    focusConcepts: ["문장 성분"],
    observations: [],
    nextAction: "explain",
    masteryEvidence: [],
    safety: { blocked: false, reason: null },
    ...overrides
  };
}

test("P1: 도움 없이 확인된 성취는 독립 성공으로 기록한다", () => {
  const evidence = deriveLearningEvidence("diagnose", response({ masteryEvidence: ["주어와 서술어를 근거와 함께 설명함"] }));
  assert.equal(evidence.independentSuccess, true);
  assert.equal(evidence.eventType, "independent_success");
});

test("P1: 비계를 사용한 성취는 독립 성공과 구분한다", () => {
  const evidence = deriveLearningEvidence("expand", response({ scaffoldLevel: 2, masteryEvidence: ["수식어를 적절히 추가함"] }));
  assert.equal(evidence.independentSuccess, false);
  assert.equal(evidence.eventType, "scaffolded_success");
});

test("P1: 성취 근거가 없으면 시도로 기록한다", () => {
  assert.equal(deriveLearningEvidence("error", response()).eventType, "attempt");
});
