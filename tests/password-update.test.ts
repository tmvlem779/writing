import assert from "node:assert/strict";
import test from "node:test";
import { passwordUpdateSchema } from "../src/lib/auth/password.ts";

test("비밀번호 설정은 8자 이상만 허용한다", () => {
  assert.equal(passwordUpdateSchema.safeParse({ password: "1234567" }).success, false);
  assert.equal(passwordUpdateSchema.safeParse({ password: "12345678" }).success, true);
});

test("비밀번호 설정은 과도하게 긴 입력을 거부한다", () => {
  assert.equal(passwordUpdateSchema.safeParse({ password: "가".repeat(129) }).success, false);
});
