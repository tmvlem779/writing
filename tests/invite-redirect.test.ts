import assert from "node:assert/strict";
import test from "node:test";
import { isSupabaseInviteHash } from "../src/lib/auth/invite-redirect.ts";

test("Supabase 초대 토큰이 있는 URL 해시를 감지한다", () => {
  assert.equal(isSupabaseInviteHash("#access_token=secret&type=invite&expires_in=3600"), true);
});

test("초대 유형이나 액세스 토큰이 빠진 URL 해시는 무시한다", () => {
  assert.equal(isSupabaseInviteHash("#access_token=secret&type=recovery"), false);
  assert.equal(isSupabaseInviteHash("#type=invite"), false);
  assert.equal(isSupabaseInviteHash("access_token=secret&type=invite"), false);
});
