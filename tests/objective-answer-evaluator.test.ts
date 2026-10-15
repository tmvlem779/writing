import assert from "node:assert/strict";
import test from "node:test";
import { applyObjectiveAnswerEvidence, hasObjectiveAnswerEvidence } from "../src/lib/agent/objective-answer-evaluator.ts";
import type { AgentResponse, TurnRequest } from "../src/lib/agent/schema.ts";

const response: AgentResponse = {
  mode: "question",
  answerStatus: "incorrect",
  questionResolution: "continue",
  resolvedQuestionAnswer: "",
  scaffoldLevel: 0,
  studentMessage: "다시 살펴보세요.",
  question: "자료에서 다시 찾아보세요.",
  focusConcepts: ["시간 표현"],
  observations: [],
  nextAction: "explain",
  activityComplete: false,
  masteryEvidence: [],
  safety: { blocked: false, reason: null }
};

test("P1·P3: 자료의 객관적 근거를 정확히 쓴 답은 모델의 오판과 관계없이 다음 질문으로 간다", () => {
  const request: TurnRequest = {
    sessionId: "session-1",
    activity: "authentic",
    message: "[학생 답]\n어제는 파일이 열리지 않았지만",
    supportMode: "submit",
    scaffoldLevel: 0,
    attemptCount: 0,
    currentQuestion: "과거 상태를 나타낸 표현을 쓰세요.",
    questionAttemptCount: 0,
    questionHintCount: 0,
    objectiveQuestionKey: "dialogue:structure:0",
    history: []
  };
  const checked = applyObjectiveAnswerEvidence(request, response);
  assert.equal(checked.answerStatus, "met");
  assert.equal(checked.questionResolution, "advance");
  assert.match(checked.studentMessage, /근거를 정확히/);
});

test("P1·P3: 자료에 없는 답은 서버가 정답으로 덮어쓰지 않는다", () => {
  assert.equal(hasObjectiveAnswerEvidence("dialogue:structure:0", "내일 파일을 다시 연다"), false);
  assert.equal(hasObjectiveAnswerEvidence("dialogue:structure:2", "어제와 지금"), false);
});

