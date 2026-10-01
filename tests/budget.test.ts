import assert from "node:assert/strict";
import test from "node:test";
import { estimateTurnCostUsd, getTokenPricingUsdPerMillion } from "../src/lib/agent/budget.ts";

test("BUDGET: GPT-5.6 Luna의 공식 입력·출력 단가로 비용을 계산한다", () => {
  assert.deepEqual(getTokenPricingUsdPerMillion("gpt-5.6-luna"), { input: 0.2, output: 1.2 });
  assert.equal(estimateTurnCostUsd(1_000_000, 1_000_000, "gpt-5.6-luna"), 1.4);
});

test("BUDGET: 기존 GPT-5 nano 사용 기록도 해당 단가로 계산한다", () => {
  assert.deepEqual(getTokenPricingUsdPerMillion("gpt-5-nano"), { input: 0.05, output: 0.4 });
  assert.equal(estimateTurnCostUsd(1_000_000, 1_000_000, "gpt-5-nano"), 0.45);
});

test("BUDGET: 알 수 없는 모델은 비용을 과소 계산하지 않는다", () => {
  const unknown = getTokenPricingUsdPerMillion("unknown-model");
  const luna = getTokenPricingUsdPerMillion("gpt-5.6-luna");
  assert.ok(unknown.input >= luna.input);
  assert.ok(unknown.output >= luna.output);
});
