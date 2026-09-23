import fs from "node:fs";

const cases = JSON.parse(fs.readFileSync("evals/cases/core.json", "utf8"));
const required = ["P1", "P2", "P3", "P4", "P5", "P6"];

if (!Array.isArray(cases) || cases.length < required.length) {
  console.error("핵심 평가 사례가 부족합니다.");
  process.exit(1);
}

for (const principle of required) {
  if (!cases.some((item) => Array.isArray(item.principles) && item.principles.includes(principle))) {
    console.error(`${principle}: 평가 사례가 없습니다.`);
    process.exit(1);
  }
}

for (const item of cases) {
  if (typeof item.id !== "string" || typeof item.expect !== "string" || item.expect.length < 10) {
    console.error("평가 사례의 id 또는 기대 결과가 불완전합니다.");
    process.exit(1);
  }
}

console.log(`${cases.length}개 교육·안전 평가 명세 검사 통과`);
