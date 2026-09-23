import fs from "node:fs";

const required = ["P1", "P2", "P3", "P4", "P5", "P6"];
const files = [
  "docs/learning-design.md",
  "prompts/system.md",
  "evals/cases/core.json"
];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const missing = required.filter((id) => !content.includes(id));
  if (missing.length) {
    console.error(`${file}: 누락된 설계 원리 ${missing.join(", ")}`);
    process.exit(1);
  }
}

console.log("P1~P6 설계 원리 추적 검사 통과");
