import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const loginPage = readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const brandLogo = readFileSync(new URL("../src/components/brand-logo.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("첫 화면은 책 모션 없이 로그인 화면으로 바로 이동한다", () => {
  assert.match(page, /import \{ redirect \} from "next\/navigation"/);
  assert.match(page, /redirect\("\/login"\)/);
  assert.doesNotMatch(page, /BookJourney/);
  assert.match(loginPage, /<LoginForm \/>/);
  assert.match(loginPage, /수업 계정으로/);
  assert.match(loginPage, /로그인/);
});

test("공통 화면의 브랜드명을 문득문득으로 통일한다", () => {
  assert.match(layout, /문득문득 \| 문장 구조와 확장/);
  assert.match(brandLogo, /aria-label="문득문득 홈"/);
  assert.match(brandLogo, />문득문득</);
  assert.doesNotMatch(layout, /문장나래/);
});

test("한국어 편집 디자인은 산세리프 제목과 서로 다른 장면 색을 사용한다", () => {
  assert.doesNotMatch(layout, /Noto_Serif_KR/);
  assert.match(layout, /Noto_Sans_KR/);
  assert.match(brandLogo, /<b>한<\/b>/);
  assert.match(styles, /--seal: #a54432/);
  assert.match(styles, /--stage-left: #c9dbe4/);
  assert.match(styles, /--stage-left: #ddd0df/);
  assert.match(styles, /--stage-left: #cbd9ce/);
  assert.match(styles, /--stage-left: #e5ceb8/);
  assert.match(styles, /\.v3-book-stage > \.v3-book-cover \{[^}]*linear-gradient\(90deg, #212a25 0 50%, #f8f3e8 50% 100%\)/s);
  assert.match(styles, /\.student-dashboard::before \{[^}]*hunminjeongeum-glyphs\.png/s);
  assert.match(styles, /\.student-dashboard-card\.dashboard-card-1::before \{[^}]*content: none;[^}]*display: none;/s);
  assert.match(styles, /\.auth-intro::before \{[^}]*writing-mode: vertical-rl/s);
});

test("상단 메뉴에는 별도 로그인 버튼을 두지 않는다", () => {
  assert.doesNotMatch(layout, /className="nav-button"/);
  assert.doesNotMatch(layout, />로그인<\/Link>/);
});
