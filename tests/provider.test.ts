import assert from "node:assert/strict";
import test from "node:test";
import { resolveTutorProvider } from "../src/lib/agent/provider.ts";

test("AI: auto 모드는 Upstage 키가 없으면 기존 OpenAI를 유지한다", () => {
  const config = resolveTutorProvider({
    AI_PROVIDER: "auto",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-5-mini"
  });

  assert.deepEqual(config, {
    provider: "openai",
    apiKey: "test-openai-key",
    model: "gpt-5-mini"
  });
});

test("AI: Upstage 키를 입력하면 Solar Mini 4로 자동 전환한다", () => {
  const config = resolveTutorProvider({
    AI_PROVIDER: "auto",
    OPENAI_API_KEY: "test-openai-key",
    UPSTAGE_API_KEY: "test-upstage-key"
  });

  assert.deepEqual(config, {
    provider: "upstage",
    apiKey: "test-upstage-key",
    baseURL: "https://api.upstage.ai/v1",
    model: "solar-mini4"
  });
});

test("AI: Upstage를 강제 선택했는데 키가 없으면 호출하지 않는다", () => {
  assert.throws(
    () => resolveTutorProvider({ AI_PROVIDER: "upstage", OPENAI_API_KEY: "test-openai-key" }),
    /MISSING_UPSTAGE_API_KEY/
  );
});

test("AI: 알 수 없는 공급자는 허용하지 않는다", () => {
  assert.throws(
    () => resolveTutorProvider({ AI_PROVIDER: "unknown", OPENAI_API_KEY: "test-openai-key" }),
    /INVALID_AI_PROVIDER/
  );
});
