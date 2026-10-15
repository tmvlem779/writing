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
    currentQuestion: "주어와 서술어를 찾아 보세요.",
    questionAttemptCount: 0,
    questionHintCount: 0,
    history: [],
    ...overrides
  };
}

function response(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    mode: "question",
    answerStatus: "partial",
    questionResolution: "continue",
    resolvedQuestionAnswer: "",
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

  assert.match(result.question, /조사|어미|구조/);
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

test("P1: 누적 답이 완료 기준을 충족했다는 판정은 꼬리질문보다 우선한다", () => {
  const result = applyTutorResponsePolicy(
    request({ attemptCount: 2, history: [
      { role: "student", content: "주어는 학생들이, 서술어는 찬다입니다." },
      { role: "assistant", content: "왜 그렇게 판단했나요?" }
    ] }),
    response({ answerStatus: "met", studentMessage: "근거도 알맞게 설명했어요.", question: "다른 근거도 있나요?" })
  );

  assert.equal(result.answerStatus, "met");
  assert.equal(result.activityComplete, true);
  assert.equal(result.question, "");
  assert.equal(result.nextAction, "complete");
  assert.ok(result.masteryEvidence.length > 0);
});

test("P1: 세 번째 학습 질문이어도 부분 충족이라는 이유만으로 활동을 끝내지 않는다", () => {
  const result = applyTutorResponsePolicy(
    request({ attemptCount: 2 }),
    response({ answerStatus: "partial", activityComplete: false, masteryEvidence: [] })
  );

  assert.equal(result.answerStatus, "partial");
  assert.equal(result.activityComplete, false);
});

test("P1: 힌트를 받은 것만으로 활동 완료가 되지 않는다", () => {
  const result = applyTutorResponsePolicy(
    request({ supportMode: "hint" }),
    response({
      answerStatus: "met",
      activityComplete: true,
      masteryEvidence: ["이전 답에서 완료 기준을 충족함"]
    })
  );

  assert.equal(result.activityComplete, false);
  assert.notEqual(result.questionResolution, "complete");
  assert.equal(result.masteryEvidence.length, 0);
});

test("P1: 여러 문장을 모두 살펴보는 활동은 마지막 문장 전에는 완료하지 않는다", () => {
  const incomplete = applyTutorResponsePolicy(
    request({ message: "[현재 과제] 소설 문장 살펴보기\n[현재까지 답을 확인한 문장] 1/4\n[활동 완료 기준] 네 문장을 모두 설명했다.\n[학생 답] 근거를 설명했습니다." }),
    response({ answerStatus: "met", activityComplete: true, masteryEvidence: ["현재 문장 근거 설명"] })
  );
  const finalSentence = applyTutorResponsePolicy(
    request({ message: "[현재 과제] 소설 문장 살펴보기\n[현재까지 답을 확인한 문장] 3/4\n[활동 완료 기준] 네 문장을 모두 설명했다.\n[학생 답] 마지막 문장의 근거를 설명했습니다." }),
    response({ answerStatus: "met", activityComplete: true, masteryEvidence: ["모든 문장 근거 설명"] })
  );

  assert.equal(incomplete.activityComplete, false);
  assert.equal(finalSentence.activityComplete, true);
});

test("P1: 같은 질문에서 세 번째 힌트를 쓰면 그 질문의 답만 공개하고 다음 질문으로 간다", () => {
  const result = applyTutorResponsePolicy(
    request({ supportMode: "hint", questionHintCount: 2 }),
    response({
      answerStatus: "not_answered",
      questionResolution: "reveal_and_advance",
      resolvedQuestionAnswer: "주어는 ‘학생들이’, 서술어는 ‘찬다’입니다.",
      question: "두 말이 문장의 중심이라고 판단한 근거는 무엇인가요?"
    })
  );

  assert.equal(result.questionResolution, "reveal_and_advance");
  assert.match(result.resolvedQuestionAnswer, /학생들이/);
  assert.match(result.question, /근거/);
  assert.equal(result.activityComplete, false);
});

test("P1: 같은 질문의 세 번째 부적절한 답은 정답 공개 뒤 다음 질문으로 이어진다", () => {
  const result = applyTutorResponsePolicy(
    request({ questionAttemptCount: 2 }),
    response({
      answerStatus: "incorrect",
      questionResolution: "continue",
      resolvedQuestionAnswer: "주어는 ‘학생들이’, 서술어는 ‘찬다’입니다.",
      question: "이제 왜 홑문장인지 한 가지 근거를 적어 보세요."
    })
  );

  assert.equal(result.questionResolution, "reveal_and_advance");
  assert.match(result.resolvedQuestionAnswer, /찬다/);
  assert.match(result.question, /홑문장/);
  assert.equal(result.activityComplete, false);
});

test("P1·P3: 현재 질문을 충분히 답해 다음 질문으로 간 경우 실패 횟수로 처리하지 않는다", () => {
  const result = applyTutorResponsePolicy(
    request({ questionAttemptCount: 2 }),
    response({ answerStatus: "partial", questionResolution: "advance", question: "다음 근거를 적어 보세요." })
  );

  assert.equal(result.questionResolution, "advance");
  assert.equal(result.resolvedQuestionAnswer, "");
  assert.equal(result.activityComplete, false);
});

test("P1·P3: 어느 정도 적절한 답은 같은 질문을 바꾸어 되묻지 않고 다음 학습 질문으로 간다", () => {
  const result = applyTutorResponsePolicy(
    request({ activity: "create", attemptCount: 1, currentQuestion: "문장에 빠진 조건을 하나 보태 보세요." }),
    response({
      answerStatus: "partial",
      questionResolution: "continue",
      question: "빠진 조건을 찾아 문장에 한 가지 더 넣어 볼까요?"
    })
  );

  assert.equal(result.questionResolution, "advance");
  assert.equal(result.question, "그 변화로 뜻이나 상황 적절성이 어떻게 달라졌는지 적어 보세요.");
  assert.match(result.studentMessage, /다음 학습 질문/);
  assert.equal(result.activityComplete, false);
});

test("P1·P3: 첫 두 번의 부적절한 답에는 질문 문구를 바꾸지 않아 질문별 횟수를 유지한다", () => {
  const result = applyTutorResponsePolicy(
    request({ currentQuestion: "주어와 서술어를 찾아 보세요.", questionAttemptCount: 1 }),
    response({
      answerStatus: "incorrect",
      questionResolution: "continue",
      question: "이 문장의 주어와 서술어는 무엇인가요?"
    })
  );

  assert.equal(result.questionResolution, "continue");
  assert.equal(result.question, "주어와 서술어를 찾아 보세요.");
  assert.equal(result.resolvedQuestionAnswer, "");
});

test("P1·P3: 첫 두 번의 힌트에는 현재 질문을 유지하고 정답을 공개하지 않는다", () => {
  const result = applyTutorResponsePolicy(
    request({ supportMode: "hint", questionHintCount: 1, currentQuestion: "주어와 서술어를 찾아 보세요." }),
    response({
      answerStatus: "not_answered",
      questionResolution: "continue",
      question: "누가 무엇을 하는지 찾아 볼까요?"
    })
  );

  assert.equal(result.questionResolution, "continue");
  assert.equal(result.question, "주어와 서술어를 찾아 보세요.");
  assert.equal(result.resolvedQuestionAnswer, "");
});

test("P3: 두 개 이상의 질문을 한꺼번에 요구하지 않는다", () => {
  const result = applyTutorResponsePolicy(request({ attemptCount: 1 }), response({
    question: "무엇을 찾았나요? 왜 그렇게 생각했나요?"
  }));

  assert.doesNotMatch(result.question, /\?.*\?/);
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
  assert.match(result.question, /달라진 표현|빠진 조건/);
});

test("DATA: 학생 문장 명시와 중복 분석 방지 규칙은 프롬프트 v16으로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610060003_add_explicit_answer_reference_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v16/);
  assert.match(migration, /explicit-answer-reference-no-duplicate-analysis/);
});

test("DATA: 누적 답 숙달 판정과 3회 종료 규칙은 프롬프트 v18로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610100001_add_cumulative_mastery_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v18/);
  assert.match(migration, /cumulative-mastery-before-three-turn-resolution/);
});

test("DATA: 질문별 세 번 지원 뒤 계속 학습하는 규칙은 프롬프트 v19로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610100002_add_per_question_resolution_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v19/);
  assert.match(migration, /per-question-three-support-then-continue/);
});

test("DATA: 적절한 답의 다음 질문 이동과 표현만 바꾼 반복 방지는 프롬프트 v20으로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610120001_add_semantic_question_progression_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v20/);
  assert.match(migration, /advance-adequate-answers-without-paraphrase-loops/);
});

test("P1·P3: 제한형 실생활 활동은 적절한 핵심 답 세 개를 확인한 뒤 완료한다", () => {
  const first = applyTutorResponsePolicy(
    request({
      activity: "authentic",
      message: "[현재 과제] 구조 찾기\n[학습 질문 진행] 0/3\n[활동 완료 기준] 핵심 질문 세 가지에 답했다.\n[학생 답] 원인과 결과가 연결됩니다."
    }),
    response({ answerStatus: "met", activityComplete: true, masteryEvidence: ["원인 관계 확인"] })
  );
  const third = applyTutorResponsePolicy(
    request({
      activity: "authentic",
      message: "[현재 과제] 구조 찾기\n[학습 질문 진행] 2/3\n[활동 완료 기준] 핵심 질문 세 가지에 답했다.\n[학생 답] 조건절이 행동의 조건을 분명히 합니다."
    }),
    response({ answerStatus: "met", activityComplete: false })
  );

  assert.equal(first.activityComplete, false);
  assert.equal(first.questionResolution, "advance");
  assert.equal(third.activityComplete, true);
  assert.equal(third.questionResolution, "complete");
});

test("P1·P3: 제한형 실생활 활동의 부분 답은 핵심 질문 완료로 세지 않고 쉬운 보조 질문을 이어 간다", () => {
  const result = applyTutorResponsePolicy(
    request({
      activity: "authentic",
      message: "[현재 과제] 구조 찾기\n[학습 질문 진행] 1/3\n[활동 완료 기준] 핵심 질문 세 가지에 답했다.\n[학생 답] 시간이 나옵니다.",
      questionAttemptCount: 0,
      currentQuestion: "자료에서 과거 시제가 드러나는 표현 한 곳을 그대로 쓰세요."
    }),
    response({
      answerStatus: "partial",
      questionResolution: "advance",
      question: "‘지난달’과 ‘다음 달’ 중 이미 지난 때를 나타내는 말을 고르세요."
    })
  );

  assert.equal(result.activityComplete, false);
  assert.equal(result.answerStatus, "partial");
  assert.equal(result.questionResolution, "continue");
  assert.equal(result.question, "‘지난달’과 ‘다음 달’ 중 이미 지난 때를 나타내는 말을 고르세요.");
});

test("P1: 제한형 실생활 활동은 부적절한 답에 쉬운 보조 질문을 주고 세 번째에는 해당 답만 공개한다", () => {
  const scaffold = applyTutorResponsePolicy(
    request({
      activity: "authentic",
      message: "[현재 과제] 효과 설명\n[학습 질문 진행] 1/3\n[활동 완료 기준] 핵심 질문 세 가지에 답했다.\n[학생 답] 모르겠어요.",
      questionAttemptCount: 1,
      currentQuestion: "조건절이 안내의 뜻에 어떤 효과를 주나요?"
    }),
    response({
      answerStatus: "incorrect",
      questionResolution: "continue",
      resolvedQuestionAnswer: "조건을 분명하게 합니다.",
      question: "‘비가 오면’ 뒤에는 어떤 행동이 나오나요?"
    })
  );
  const reveal = applyTutorResponsePolicy(
    request({
      activity: "authentic",
      message: "[현재 과제] 효과 설명\n[학습 질문 진행] 1/3\n[활동 완료 기준] 핵심 질문 세 가지에 답했다.\n[학생 답] 모르겠어요.",
      questionAttemptCount: 2,
      currentQuestion: "‘비가 오면’ 뒤에는 어떤 행동이 나오나요?"
    }),
    response({
      answerStatus: "incorrect",
      questionResolution: "continue",
      resolvedQuestionAnswer: "조건을 분명하게 합니다.",
      question: "이 표현이 없을 때와 무엇이 달라지나요?"
    })
  );

  assert.equal(scaffold.activityComplete, false);
  assert.equal(scaffold.questionResolution, "continue");
  assert.equal(scaffold.resolvedQuestionAnswer, "");
  assert.equal(scaffold.question, "‘비가 오면’ 뒤에는 어떤 행동이 나오나요?");
  assert.equal(reveal.activityComplete, false);
  assert.equal(reveal.questionResolution, "reveal_and_advance");
  assert.equal(reveal.resolvedQuestionAnswer, "조건을 분명하게 합니다.");
});

test("P1: 세 번째 핵심 질문에서 세 차례 지원을 마치면 답을 확인하고 해당 단계만 종료한다", () => {
  const result = applyTutorResponsePolicy(
    request({
      activity: "authentic",
      message: "[현재 과제] 고쳐 쓰기\n[학습 질문 진행] 2/3\n[활동 완료 기준] 핵심 질문 세 가지에 답했다.\n[학생 답] 잘 모르겠어요.",
      questionHintCount: 2,
      supportMode: "hint",
      currentQuestion: "안내 목적에 맞게 어느 부분을 바꾸면 좋을까요?"
    }),
    response({
      answerStatus: "not_answered",
      resolvedQuestionAnswer: "행동 조건을 앞에 분명히 덧붙일 수 있어요.",
      question: "조건이 보이도록 첫 부분을 살펴볼까요?"
    })
  );

  assert.equal(result.questionResolution, "reveal_and_advance");
  assert.equal(result.activityComplete, true);
  assert.equal(result.question, "");
  assert.equal(result.masteryEvidence.length, 0);
});

test("P1·P2: 문장 만들기는 네 번째 핵심 질문을 해결한 뒤에만 완료한다", () => {
  const third = applyTutorResponsePolicy(
    request({
      activity: "create",
      message: "[현재 과제] 단계별 문장 만들기\n[학습 질문 진행] 2/4\n[활동 완료 기준] 네 단계로 문장을 확장했다.\n[학생 답] 비가 와서 두 학생이 함께 우산을 썼다."
    }),
    response({ answerStatus: "met", activityComplete: true, masteryEvidence: ["절과 연결 표현 추가"] })
  );
  const fourth = applyTutorResponsePolicy(
    request({
      activity: "create",
      message: "[현재 과제] 단계별 문장 만들기\n[학습 질문 진행] 3/4\n[활동 완료 기준] 네 단계로 문장을 확장했다.\n[학생 답] 아침에 비가 와서 두 학생이 정문에서 함께 우산을 썼다."
    }),
    response({ answerStatus: "met", activityComplete: false, masteryEvidence: [] })
  );

  assert.equal(third.questionResolution, "advance");
  assert.equal(third.activityComplete, false);
  assert.equal(fourth.questionResolution, "complete");
  assert.equal(fourth.activityComplete, true);
});

test("P1·P2·P3: 문장 만들기의 보조 질문은 핵심 단계로 세지 않고 세 번째 실패에만 답을 공개한다", () => {
  const feedback = applyTutorResponsePolicy(
    request({
      activity: "create",
      message: "[현재 과제] 단계별 문장 만들기\n[학습 질문 진행] 1/4\n[활동 완료 기준] 네 단계로 문장을 확장했다.\n[학생 답] 학생이 준비했다.",
      questionAttemptCount: 1,
      currentQuestion: "앞 문장에 부속 성분 하나를 더해 다시 써 보세요."
    }),
    response({
      answerStatus: "partial",
      questionResolution: "advance",
      question: "언제, 어디서 중 하나를 골라 문장에 넣어 보세요."
    })
  );
  const reveal = applyTutorResponsePolicy(
    request({
      activity: "create",
      message: "[현재 과제] 단계별 문장 만들기\n[학습 질문 진행] 1/4\n[활동 완료 기준] 네 단계로 문장을 확장했다.\n[학생 답] 학생이 준비했다.",
      questionAttemptCount: 2,
      currentQuestion: "언제, 어디서 중 하나를 골라 문장에 넣어 보세요."
    }),
    response({
      answerStatus: "partial",
      questionResolution: "continue",
      resolvedQuestionAnswer: "두 학생이 교실에서 발표를 준비했다.",
      question: "어디에서 준비했는지 넣어 보세요."
    })
  );

  assert.equal(feedback.questionResolution, "continue");
  assert.equal(feedback.activityComplete, false);
  assert.equal(reveal.questionResolution, "reveal_and_advance");
  assert.match(reveal.resolvedQuestionAnswer, /교실에서/);
  assert.equal(reveal.activityComplete, false);
});

test("DATA: 실생활 자료의 세 질문 완료와 보조 질문 규칙은 프롬프트 v21로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610120002_add_bounded_real_life_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v21/);
  assert.match(migration, /three-question-sequential-real-life-practice/);
});

test("DATA: 정확한 답만 핵심 질문으로 세는 규칙은 프롬프트 v22로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610130001_add_strict_clear_real_life_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v22/);
  assert.match(migration, /strict-correctness-and-clear-scaffold-questions/);
});

test("DATA: 원문 유지와 중립적 성찰 질문은 프롬프트 v23으로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610130002_add_original_preserving_rewrite_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v23/);
  assert.match(migration, /allow-purpose-fit-originals-without-false-comparison/);
});

test("DATA: 의도적으로 어색한 실생활 고쳐 쓰기 자료는 프롬프트 v24로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610130003_add_intentionally_flawed_rewrite_sources_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v24/);
  assert.match(migration, /intentionally-flawed-authentic-rewrite-sources/);
});

test("DATA: 네 단계 문장 확장과 단계별 세 번 지원 규칙은 프롬프트 v25로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610130004_add_four_step_sentence_building_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v25/);
  assert.match(migration, /four-step-progressive-sentence-building/);
});

test("DATA: 객관적 근거 확인과 명확한 질문 규칙은 프롬프트 v26으로 추적한다", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202610150001_add_objective_evidence_prompt.sql", import.meta.url), "utf8");
  assert.match(migration, /writing-tutor-v26/);
  assert.match(migration, /objective-evidence-clear-questions-and-durable-learning-state/);
});
