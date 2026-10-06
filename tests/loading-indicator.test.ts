import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("AI 요청 중에는 버튼 안에 문득문득 네 글자 로딩 상태를 하나만 보여 준다", () => {
  const loader = fs.readFileSync("src/components/mondeuk-loading.tsx", "utf8");
  const practice = fs.readFileSync("src/components/practice-chapter.tsx", "utf8");
  const realLife = fs.readFileSync("src/components/real-life-chapter.tsx", "utf8");

  assert.match(loader, /\["문", "득", "문", "득"\]/);
  assert.match(loader, /role="status"/);
  assert.match(loader, /aria-live="polite"/);
  assert.doesNotMatch(loader, /mondeuk-loading-message/);
  assert.match(practice, /pendingAction === "hint" \? <MondeukLoading compact \/>/);
  assert.match(practice, /pendingAction === "submit" \? <MondeukLoading compact \/>/);
  assert.match(realLife, /pending \? <MondeukLoading compact/);
  assert.doesNotMatch(practice, /pending && <MondeukLoading \/>/);
  assert.doesNotMatch(realLife, /pending && <MondeukLoading \/>/);
  assert.match(practice, /aria-busy=\{pendingAction !== null\}/);
  assert.match(realLife, /aria-busy=\{pending\}/);
});

test("AI 학습 도우미의 질문은 학생 수정 입력란보다 먼저 제시한다", () => {
  const practice = fs.readFileSync("src/components/practice-chapter.tsx", "utf8");
  const coachCard = practice.indexOf('className="coach-card"');
  const draftLabel = practice.indexOf('htmlFor="student-draft">내 문장과 생각');

  assert.ok(coachCard >= 0);
  assert.ok(draftLabel >= 0);
  assert.ok(coachCard < draftLabel);
});

test("로딩 애니메이션은 움직임 축소 설정을 존중한다", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /@keyframes mondeuk-pulse/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.mondeuk-loading-overlay \.mondeuk-loading \{[^}]*background: transparent;[^}]*box-shadow: none;/s);
  assert.match(css, /\.daily-roadmap-loading \.mondeuk-loading \{[^}]*border: 0;[^}]*background: transparent;[^}]*box-shadow: none;/s);
  assert.match(css, /\.mondeuk-loading-syllables i \{[^}]*background: transparent;[^}]*font-size: 40px;/s);
  for (const index of [1, 2, 3, 4]) assert.match(css, new RegExp(`\\.mondeuk-loading-syllables i:nth-child\\(${index}\\) \\{ color:`));
  for (const color of ["#245b43", "#d66a3f", "#789321", "#667b8c"]) assert.match(css, new RegExp(color));
});

test("로그인 뒤 화면 전환과 학습 경로 이동에도 전체 화면 로딩을 제공한다", () => {
  const globalLoading = fs.readFileSync("src/app/loading.tsx", "utf8");
  const learnLoading = fs.readFileSync("src/app/learn/loading.tsx", "utf8");
  const login = fs.readFileSync("src/components/login-form.tsx", "utf8");

  assert.match(globalLoading, /MondeukLoadingOverlay/);
  assert.match(learnLoading, /MondeukLoadingOverlay/);
  assert.match(login, /pendingAction === "login" && <MondeukLoadingOverlay/);
  assert.match(login, /if \(error\) \{\s*setPendingAction\(null\)/);
  const loginSubmit = login.slice(login.indexOf("async function onSubmit"), login.indexOf("  return ("));
  assert.ok(loginSubmit.indexOf("if (error)") < loginSubmit.indexOf("setPendingAction(null)"));
});

test("인증·저장·초대처럼 기다림이 생기는 동작은 모두 문득문득 애니메이션을 표시한다", () => {
  const componentFiles = [
    "src/components/login-form.tsx",
    "src/components/logout-button.tsx",
    "src/components/invite-form.tsx",
    "src/components/set-password-form.tsx",
    "src/components/grammar-diagnostic.tsx",
    "src/components/password-setup-session-redirect.tsx"
  ];

  for (const file of componentFiles) {
    assert.match(fs.readFileSync(file, "utf8"), /MondeukLoading/);
  }
});
