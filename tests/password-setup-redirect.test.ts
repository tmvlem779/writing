import assert from "node:assert/strict";
import test from "node:test";
import { parsePasswordSetupHash } from "../src/lib/auth/password-setup-redirect.ts";

test("Supabase 초대 토큰을 비밀번호 설정 세션으로 읽는다", () => {
  assert.deepEqual(
    parsePasswordSetupHash("#access_token=access&type=invite&refresh_token=refresh"),
    { accessToken: "access", refreshToken: "refresh" }
  );
});

test("Supabase 비밀번호 복구 토큰도 비밀번호 설정 세션으로 읽는다", () => {
  assert.deepEqual(
    parsePasswordSetupHash("#refresh_token=refresh&type=recovery&access_token=access"),
    { accessToken: "access", refreshToken: "refresh" }
  );
});

test("허용되지 않은 유형이나 불완전한 토큰은 무시한다", () => {
  assert.equal(parsePasswordSetupHash("#access_token=access&type=signup&refresh_token=refresh"), null);
  assert.equal(parsePasswordSetupHash("#type=invite&access_token=access"), null);
  assert.equal(parsePasswordSetupHash("access_token=access&type=invite&refresh_token=refresh"), null);
});
