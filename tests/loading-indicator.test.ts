import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("AI 요청 중에는 문득문득 네 글자 로딩 상태를 즉시 보여 준다", () => {
  const loader = fs.readFileSync("src/components/mondeuk-loading.tsx", "utf8");
  const practice = fs.readFileSync("src/components/practice-chapter.tsx", "utf8");
  const realLife = fs.readFileSync("src/components/real-life-chapter.tsx", "utf8");

  assert.match(loader, /\["문", "득", "문", "득"\]/);
  assert.match(loader, /role="status"/);
  assert.match(loader, /aria-live="polite"/);
  assert.match(practice, /pending && <MondeukLoading \/>/);
  assert.match(realLife, /pending && <MondeukLoading \/>/);
  assert.match(practice, /aria-busy=\{pending\}/);
  assert.match(realLife, /aria-busy=\{pending\}/);
});

test("로딩 애니메이션은 움직임 축소 설정을 존중한다", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /@keyframes mondeuk-pulse/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
