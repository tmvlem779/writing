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
  assert.match(bookJourney, /단계별 질문으로 생각의 문을 열고, 스스로 올바른 문장을 쓰도록 돕습니다/);
  assert.match(bookJourney, /<LoginForm \/>/);
  assert.match(bookJourney, /학교 계정으로 학습 이어가기/);
  assert.doesNotMatch(bookJourney, /title: "학교 계정으로\\n이어갑니다"/);
});

test("첫 화면에서 학습 원리와 수업 흐름 소개 영역을 제거한다", () => {
  assert.doesNotMatch(bookJourney, /학습 원리/);
  assert.doesNotMatch(bookJourney, /수업 흐름/);
  assert.doesNotMatch(bookJourney, /principles/);
  assert.doesNotMatch(bookJourney, /journey-list/);
});

test("ver.3 첫 화면은 종이 앞뒤와 그림자가 보이는 책장 넘김으로 전환된다", () => {
  assert.match(bookJourney, /requestAnimationFrame/);
  assert.match(bookJourney, /const open = clamp\(progress \/ 0\.14\)/);
  assert.match(bookJourney, /progress < 0\.074 \? 0/);
  assert.match(bookJourney, /storyStep > 1/);
  assert.match(bookJourney, /--book-open/);
  assert.match(bookJourney, /--book-explore/);
  assert.match(bookJourney, /--page-write/);
  assert.match(bookJourney, /v3-page-spread/);
  assert.match(bookJourney, /v3-book-cover/);
  assert.match(bookJourney, /title: "오늘의 문법책에\\n내 문장을 남겨 보세요\."/);
  assert.match(bookJourney, /학교 계정으로 로그인하면 학습 기록이 이어집니다/);
  assert.match(bookJourney, /StageIllustration/);
  assert.match(bookJourney, /v3-visual-stack/);
  assert.match(bookJourney, /v3-scroll-sheet-front/);
  assert.match(bookJourney, /v3-scroll-sheet-back/);
  assert.match(bookJourney, /turnDirection/);
  assert.match(styles, /\.v3-book-stage \{[^}]*position: sticky/s);
  assert.match(styles, /\.v3-page-spread \{[^}]*grid-template-columns: 1fr 18px 1fr/s);
  assert.match(styles, /\.v3-book-journey\.story-step-1 \{ --stage-left:/);
  assert.match(styles, /\.v3-book-journey\.story-step-4 \{ --stage-left:/);
  assert.match(styles, /@keyframes v3-page-turn-forward-clear/);
  assert.match(styles, /@keyframes v3-page-turn-backward-clear/);
  assert.match(styles, /\.v3-scroll-sheet-face \{[^}]*backface-visibility: hidden/s);
  assert.match(styles, /\.v3-book-viewport \{[^}]*width: 100vw/s);
  assert.match(styles, /\.story-step-0 \.v3-story-copy \{ opacity: 0; \}/);
  assert.match(styles, /\.v3-visual-stack figure:first-child \{ visibility: hidden; \}/);
  assert.match(styles, /\.story-step-0 \.v3-visual-stack figure:first-child \{[^}]*display: none/s);
  assert.match(styles, /\.story-step-0 \.v3-page-spread \{ visibility: visible; \}/);
  assert.match(styles, /\.v3-book-stage > \.v3-book-cover \{[^}]*z-index: 18/s);
  assert.match(styles, /\.story-step-0 \.v3-story-panel\.panel-1 \{[^}]*visibility: visible/s);
  assert.match(styles, /\.story-step-0 \.v3-visual-stack figure:nth-child\(2\) \{[^}]*visibility: visible/s);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("공통 화면의 브랜드명을 문득문득으로 통일한다", () => {
  assert.match(layout, /문득문득 \| 문장 구조와 확장/);
  assert.match(brandLogo, /aria-label="문득문득 홈"/);
  assert.match(brandLogo, />문득문득</);
  assert.doesNotMatch(layout, /문장나래/);
});

test("한국어 편집 디자인은 명조 제목과 한지·먹색·인주색을 공통 언어로 사용한다", () => {
  assert.match(layout, /Noto_Serif_KR/);
  assert.match(layout, /variable: "--font-brand"/);
  assert.match(brandLogo, /<b>한<\/b>/);
  assert.match(bookJourney, /className="hangul-art/);
  assert.match(styles, /--seal: #a54432/);
  assert.match(styles, /현대적인 한국어 편집 디자인/);
  assert.match(styles, /\.v3-book-stage > \.v3-book-cover \{[^}]*linear-gradient\(90deg, #212a25 0 50%, #f8f3e8 50% 100%\)/s);
  assert.match(styles, /\.student-dashboard::before \{[^}]*content: "문 장"/s);
  assert.match(styles, /\.auth-intro::before \{[^}]*writing-mode: vertical-rl/s);
});

test("상단 메뉴에는 별도 로그인 버튼을 두지 않는다", () => {
  assert.doesNotMatch(layout, /className="nav-button"/);
  assert.doesNotMatch(layout, />로그인<\/Link>/);
});
