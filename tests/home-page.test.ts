import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

test("첫 화면은 문득문득을 먼저 보여 주고 학습 시작을 로그인으로 연결한다", () => {
  assert.match(page, /<span>문득문득<\/span>[\s\S]*질문으로 얻고, 문장으로 깨닫다/);
  assert.match(page, /문득문득은 답을 대신 써주지 않습니다/);
  assert.match(page, /단계별 질문으로 생각의 문을 열고, 스스로 올바른 문장을 쓰도록 돕습니다/);
  assert.match(page, /href="\/login">학습 시작하기/);
  assert.doesNotMatch(page, /학교 계정으로 로그인/);
});

test("첫 화면에서 학습 원리와 수업 흐름 소개 영역을 제거한다", () => {
  assert.doesNotMatch(page, /학습 원리/);
  assert.doesNotMatch(page, /수업 흐름/);
  assert.doesNotMatch(page, /principles/);
  assert.doesNotMatch(page, /journey-list/);
});

test("공통 화면의 브랜드명을 문득문득으로 통일한다", () => {
  assert.match(layout, /문득문득 \| 문장 구조와 확장/);
  assert.match(layout, /aria-label="문득문득 홈"/);
  assert.doesNotMatch(layout, /문장나래/);
});

test("상단 메뉴에는 별도 로그인 버튼을 두지 않는다", () => {
  assert.doesNotMatch(layout, /className="nav-button"/);
  assert.doesNotMatch(layout, />로그인<\/Link>/);
});
