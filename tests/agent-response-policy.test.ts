import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { applyTutorResponsePolicy } from "../src/lib/agent/response-policy.ts";
import type { AgentResponse, TurnRequest } from "../src/lib/agent/schema.ts";

function request(overrides: Partial<TurnRequest> = {}): TurnRequest {
  return {
    sessionId: "session-1",
    activity: "diagnose",
    message: "[현재 과제] 주어와 서술어 찾기\n[활동 완료 기준] 답과 근거를 설명했다.\n[학생 답] 학생들이, 찬다",
    supportMode: "submit",
    scaffoldLevel: 0,
    attemptCount: 0,
    history: [],
    ...overrides
  };
}

function response(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    mode: "question",
    scaffoldLevel: 0,
    studentMessage: "답을 살펴봤어요.",
    question: "근거를 하나 적어 보세요.",
    focusConcepts: ["문장 성분"],
    observations: [],
    nextAction: "explain",
    activityComplete: false,
    masteryEvidence: [],
    safety: { blocked: false, reason: null },
    ...overrides
  };
}

test("P3: 길고 정답을 되풀이하는 질문은 짧은 한 단계 질문으로 바꾼다", () => {
  const result = applyTutorResponsePolicy(request(), response({
    question: "‘학생들이’를 주어로, ‘찬다’를 서술어로 판단한 것이 맞는지 ‘누가 무엇을 하는가’라는 틀에 넣어 그 까닭을 한 문장으로 설명해 보세요."
  }));

  assert.equal(result.question, "답을 찾을 때 살핀 조사나 형태를 하나만 적어 보세요.");
  assert.ok(result.question.length <= 76);
  assert.equal(result.activityComplete, false);
});

test("P1·P3: 성취 근거가 확인되면 같은 과제를 다시 묻지 않고 끝낸다", () => {
  const result = applyTutorResponsePolicy(request(), response({
    masteryEvidence: ["주어와 서술어를 찾고 조사와 동작을 근거로 설명함"]
  }));

  assert.equal(result.activityComplete, true);
  assert.equal(result.nextAction, "complete");
  assert.equal(result.question, "");
});

test("P3: 두 개 이상의 질문을 한꺼번에 요구하지 않는다", () => {
  const result = applyTutorResponsePolicy(request({ attemptCount: 1 }), response({
    question: "무엇을 찾았나요? 왜 그렇게 생각했나요?"
  }));

  assert.equal(result.question, "가장 확실한 단서 하나를 골라 적어 보세요.");
  assert.equal((result.question.match(/\?/g) ?? []).length, 0);
});

test("P1: 완료 기준이 없는 기존 활동의 성취 근거는 보존한다", () => {
  const result = applyTutorResponsePolicy(
    request({ message: "[현재 과제] 작품의 표현 효과 찾기\n[학생 답] 반복 표현이 강조 효과를 줍니다." }),
    response({ masteryEvidence: ["반복 표현과 강조 효과를 연결함"] })
  );

  assert.equal(result.activityComplete, false);
  assert.deepEqual(result.masteryEvidence, ["반복 표현과 강조 효과를 연결함"]);
});

test("DATA: 간결한 질문과 숙달 종료 규칙은 프롬프트 v15로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610060001_add_concise_mastery_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v15/);
  assert.match(migration, /concise-non-leading-mastery-stop/);
});

test("P2·P3: 문장 생성의 간결화 질문은 이미 사용한 성분을 다시 분석하게 하지 않는다", () => {
  const result = applyTutorResponsePolicy(
    request({ activity: "create" }),
    response({ question: "내가 쓴 문장에서 주어와 목적어와 부사어와 서술어가 각각 무엇인지 모두 찾아서 그 역할을 자세하게 다시 설명해 보세요." })
  );
  assert.doesNotMatch(result.question, /주어|목적어|부사어|서술어/);
  assert.match(result.question, /빠진 조건/);
});

test("DATA: 학생 문장 명시와 중복 분석 방지 규칙은 프롬프트 v16으로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610060003_add_explicit_answer_reference_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v16/);
  assert.match(migration, /explicit-answer-reference-no-duplicate-analysis/);
});
