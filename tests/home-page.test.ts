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
  assert.match(loginPage, /<h1>문득문득<\/h1>/);
  assert.match(loginPage, /className="auth-slogan"/);
  assert.match(loginPage, /slogan-question">질문/);
  assert.match(loginPage, /slogan-discover">깨닫/);
  assert.match(loginPage, /slogan-sentence">문장/);
  assert.match(loginPage, /slogan-gain">얻/);
  assert.match(loginPage, /로그인/);
  assert.doesNotMatch(loginPage, /학교 수업 전용|수업 계정으로|학생 데이터 안내 보기/);
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
  assert.match(styles, /linear-gradient\(90deg, #dfeeff 0 50%, #fff9f0 50%\)/);
  assert.doesNotMatch(styles, /content: "학교 수업 기록"/);
  assert.doesNotMatch(styles, /content: "한글로 생각하고, 문장으로 쓰다"/);
});

test("브랜드 전체는 흰 바탕과 블루 계열, 코랄 포인트 토큰을 사용한다", () => {
  assert.match(styles, /--motion-pine: #365486/);
  assert.match(styles, /--motion-clay: #ef6f8a/);
  assert.match(styles, /--motion-leaf: #79c2d6/);
  assert.match(styles, /--palette-navy: #11133f/);
  assert.match(
    styles,
    /\.auth-intro \{[\s\S]*?background: #e4f6f8;/,
  );
  assert.match(
    styles,
    /\.student-dashboard-card\.dashboard-card-1 \{ background: var\(--motion-pine\); \}/,
  );
  assert.match(
    styles,
    /\.teacher-learning-dashboard-header \{ background: var\(--motion-pine\) !important; \}/,
  );
  assert.match(
    styles,
    /\.course-map \.lesson-activity-summary \{ background: var\(--palette-blue-soft\); color: var\(--palette-navy\); \}/,
  );
  assert.match(styles, /\.mondeuk-loading-syllables i:nth-child\(4\) \{ color: var\(--motion-pine\); \}/);
  assert.match(styles, /body \{[\s\S]*?background-color: #fff;[\s\S]*?background-image: none;/);
  assert.match(styles, /\.auth-intro::before \{[\s\S]*?hunminjeongeum-glyphs\.png[\s\S]*?opacity: \.055;/);
  assert.match(styles, /\.auth-intro h1 \{\s*letter-spacing: \.04em;/);
  assert.match(styles, /\.check-feedback\.correct,[\s\S]*?background: #e4f6f8;/);
  assert.match(styles, /\.daily-roadmap-summary dl div \{ background: #eef9fb; \}/);
  assert.match(styles, /\.task-card \{[\s\S]*?box-shadow: 0 18px 38px rgba\(17,19,63,\.13\)/);
});

test("로그인 화면 상단에는 브랜드만 남기고 공통 메뉴를 제거한다", () => {
  assert.doesNotMatch(layout, /<nav/);
  assert.doesNotMatch(layout, /학습하기|나의 기록|교사 화면|개인정보 안내/);
});

test("오늘의 챌린지는 큰 안내 글자와 단색 블루 표지를 사용한다", () => {
  assert.match(styles, /\.student-learning-nav \.student-learning-tabs a strong \{ color: #171917; font-size: 18px;/);
  assert.match(styles, /\.course-map-feature > header > span \{ font-size: 16px; \}/);
  assert.match(styles, /\.course-feature-art \{ background: var\(--motion-pine\); \}/);
  assert.match(styles, /\.course-feature-art > i \{ font-size: 38px; \}/);
  assert.match(styles, /\.course-key-question \{ font-size: 16px; \}/);
  assert.match(styles, /\.course-map \.lesson-tab strong \{ color: #171917; font-size: 17px;/);
  assert.match(styles, /\.practice-studio-shell \.activity-sidebar \{ background: var\(--motion-pine\); \}/);
  assert.match(styles, /\.practice-studio-shell \.task-card p \{ font-size: 17px; line-height: 1\.75; \}/);
});
