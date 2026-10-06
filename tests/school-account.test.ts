import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isValidLoginId, normalizeLoginId, toSchoolAccountEmail } from "../src/lib/auth/school-account.ts";

test("AUTH: 학교 아이디는 소문자로 정규화하고 실제 이메일을 수집하지 않는다", () => {
  assert.equal(normalizeLoginId("  Tmvlem779 "), "tmvlem779");
  assert.equal(isValidLoginId("tmvlem779"), true);
  assert.equal(isValidLoginId("779student"), false);
  assert.equal(isValidLoginId("학생779"), false);
  assert.equal(toSchoolAccountEmail("tmvlem779"), "tmvlem779@accounts.mundeuk.invalid");
});

test("AUTH: 로그인 화면은 아이디를 내부 인증 주소로 변환한다", () => {
  const login = fs.readFileSync("src/components/login-form.tsx", "utf8");
  assert.match(login, /학교 아이디/);
  assert.match(login, /toSchoolAccountEmail/);
  assert.doesNotMatch(login, /type="email"/);
  assert.doesNotMatch(login, /resetPasswordForEmail/);
});

test("AUTH: 교사는 이메일 초대 대신 아이디와 초기 비밀번호로 학생 계정을 만든다", () => {
  const form = fs.readFileSync("src/components/invite-form.tsx", "utf8");
  const route = fs.readFileSync("src/app/api/teacher/invite/route.ts", "utf8");
  assert.match(form, /학생 아이디/);
  assert.match(form, />이름<input/);
  assert.match(form, /초기 비밀번호/);
  assert.match(form, /pattern="\(\?=\.\*\[A-Za-z\]\)\(\?=\.\*\[0-9\]\)\[A-Za-z0-9\]\{8,128\}"/);
  assert.match(route, /admin\.auth\.admin\.createUser/);
  assert.match(route, /display_alias: input\.data\.displayName/);
  assert.match(route, /email_confirm: true/);
  assert.match(route, /status: "active"/);
  assert.doesNotMatch(route, /inviteUserByEmail/);
});

test("AUTH·PRIVACY: 교사는 담당 학급의 학생 계정 목록을 보고 생성 직후 갱신한다", () => {
  const page = fs.readFileSync("src/app/teacher/page.tsx", "utf8");
  const form = fs.readFileSync("src/components/invite-form.tsx", "utf8");
  const styles = fs.readFileSync("src/app/globals.css", "utf8");
  assert.match(page, /학생 계정 목록/);
  assert.match(page, /student-account-list/);
  assert.match(page, /class_id,user_id,status,created_at/);
  assert.match(page, /\.eq\("user_id", auth\.user\.id\)\.eq\("role", "teacher"\)\.eq\("status", "active"\)/);
  assert.match(page, /memberships\.filter\(\(membership\) => membership\.class_id === item\.id\)/);
  assert.match(form, /router\.refresh\(\)/);
  assert.match(styles, /\.student-account-list li/);
});
