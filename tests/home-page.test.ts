import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const bookJourney = readFileSync(new URL("../src/components/book-journey.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const brandLogo = readFileSync(new URL("../src/components/brand-logo.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("첫 화면은 문득문득을 먼저 보여 주고 학습 시작을 로그인으로 연결한다", () => {
  assert.match(page, /BookJourney/);
  assert.match(bookJourney, /<strong>문득문득<\/strong>/);
  assert.match(bookJourney, /title: "질문으로 얻고,\\n문장으로 깨닫다"/);
  assert.match(bookJourney, /문득문득은 답을 대신 써주지 않습니다/);
  assert.match(bookJourney, /단계별 질문으로 생각의 문을 열고, 스스로 올바른 문장을 쓰도록 돕습니다/);
  assert.match(bookJourney, /<LoginForm \/>/);
  assert.match(bookJourney, /학교 계정으로 학습 이어가기/);
  assert.doesNotMatch(bookJourney, /학교 계정으로 로그인/);
});

test("첫 화면에서 학습 원리와 수업 흐름 소개 영역을 제거한다", () => {
  assert.doesNotMatch(bookJourney, /학습 원리/);
  assert.doesNotMatch(bookJourney, /수업 흐름/);
  assert.doesNotMatch(bookJourney, /principles/);
  assert.doesNotMatch(bookJourney, /journey-list/);
});

test("ver.3 첫 화면은 스크롤 진행도에 따라 표지가 열리고 책 속 학습 단계로 전환된다", () => {
  assert.match(bookJourney, /requestAnimationFrame/);
  assert.match(bookJourney, /--book-open/);
  assert.match(bookJourney, /--book-explore/);
  assert.match(bookJourney, /--page-write/);
  assert.match(bookJourney, /v3-book-cover/);
  assert.match(bookJourney, /v3-page-spread/);
  assert.match(styles, /\.v3-book-stage \{[^}]*position: sticky/s);
  assert.match(styles, /rotateY\(calc\(var\(--book-open\) \* -172deg\)\)/);
  assert.match(styles, /\.v3-book-viewport \{[^}]*width: 100vw/s);
  assert.match(styles, /\.v3-page-spread \{[^}]*grid-template-columns: 1fr 18px 1fr/s);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("공통 화면의 브랜드명을 문득문득으로 통일한다", () => {
  assert.match(layout, /문득문득 \| 문장 구조와 확장/);
  assert.match(brandLogo, /aria-label="문득문득 홈"/);
  assert.match(brandLogo, />문득문득</);
  assert.doesNotMatch(layout, /문장나래/);
});

test("상단 메뉴에는 별도 로그인 버튼을 두지 않는다", () => {
  assert.doesNotMatch(layout, /className="nav-button"/);
  assert.doesNotMatch(layout, />로그인<\/Link>/);
});
