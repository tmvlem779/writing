import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  estimateTurnCostUsd,
  getTokenPricingUsdPerMillion
} from "../src/lib/agent/budget.ts";

const agentTurnRoute = readFileSync(new URL("../src/app/api/agent/turn/route.ts", import.meta.url), "utf8");
const environmentExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");

test("BUDGET: Solar Mini 4의 공식 입력·출력 단가로 비용을 계산한다", () => {
  assert.deepEqual(getTokenPricingUsdPerMillion("solar-mini4"), { input: 0.1, output: 0.4 });
  assert.equal(estimateTurnCostUsd(1_000_000, 1_000_000, "solar-mini4"), 0.5);
});

test("BUDGET: GPT-5 Mini의 공식 입력·출력 단가로 비용을 계산한다", () => {
  assert.deepEqual(getTokenPricingUsdPerMillion("gpt-5-mini"), { input: 0.25, output: 2 });
  assert.equal(estimateTurnCostUsd(1_000_000, 1_000_000, "gpt-5-mini"), 2.25);
});

test("BUDGET: 기존 GPT-5.6 Luna 사용 기록도 해당 단가로 계산한다", () => {
  assert.deepEqual(getTokenPricingUsdPerMillion("gpt-5.6-luna"), { input: 0.2, output: 1.2 });
  assert.equal(estimateTurnCostUsd(1_000_000, 1_000_000, "gpt-5.6-luna"), 1.4);
});

test("BUDGET: 기존 GPT-5 nano 사용 기록도 해당 단가로 계산한다", () => {
  assert.deepEqual(getTokenPricingUsdPerMillion("gpt-5-nano"), { input: 0.05, output: 0.4 });
  assert.equal(estimateTurnCostUsd(1_000_000, 1_000_000, "gpt-5-nano"), 0.45);
});

test("BUDGET: 알 수 없는 모델은 비용을 과소 계산하지 않는다", () => {
  const unknown = getTokenPricingUsdPerMillion("unknown-model");
  const mini = getTokenPricingUsdPerMillion("gpt-5-mini");
  assert.ok(unknown.input >= mini.input);
  assert.ok(unknown.output >= mini.output);
});

test("BUDGET: 사용자별 일일 한도 없이 월 예산과 세션별 한도를 유지한다", () => {
  assert.match(agentTurnRoute, /assertBudgetAvailable\(admin\)/);
  assert.match(agentTurnRoute, /assertSessionTurnLimit\(admin, parsed\.data\.sessionId\)/);
  assert.doesNotMatch(agentTurnRoute, /assertDailyTurnLimit|DAILY_TURN_LIMIT_EXCEEDED/);
  assert.doesNotMatch(environmentExample, /DAILY_TURN_LIMIT_PER_USER/);
});

test("AI: Upstage 키는 서버 전용 환경 변수로만 선언한다", () => {
  assert.match(environmentExample, /^UPSTAGE_API_KEY=$/m);
  assert.match(environmentExample, /^UPSTAGE_MODEL=solar-mini4$/m);
  assert.doesNotMatch(environmentExample, /NEXT_PUBLIC_UPSTAGE/);
});
