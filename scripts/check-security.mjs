import fs from "node:fs";
import path from "node:path";

const roots = ["src", "scripts", "supabase", "tests", "docs", "prompts", "evals"];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(fullPath);
  }
}

for (const root of roots) if (fs.existsSync(root)) walk(root);

const secretPatterns = [
  { name: "OpenAI 키", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "JWT 서비스 키", pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g }
];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      console.error(`${file}: ${name}로 보이는 값이 포함되어 있습니다.`);
      process.exit(1);
    }
    pattern.lastIndex = 0;
  }
}

const migration = fs.readFileSync("supabase/migrations/202609230001_initial_schema.sql", "utf8");
const hardeningMigration = fs.readFileSync("supabase/migrations/202609240001_harden_helper_function_access.sql", "utf8");
const userTables = ["profiles", "classes", "class_memberships", "learning_sessions", "drafts", "turns", "concept_states", "learning_events", "safety_events", "api_usage", "prompt_versions"];
for (const table of userTables) {
  if (!migration.includes(`alter table public.${table} enable row level security`)) {
    console.error(`${table}: RLS 활성화 구문이 없습니다.`);
    process.exit(1);
  }
}

for (const helper of ["is_class_teacher", "is_teacher_of", "handle_new_user"]) {
  if (!hardeningMigration.includes(`alter function public.${helper}`)) {
    console.error(`${helper}: public 스키마에서 제거하는 보안 마이그레이션이 없습니다.`);
    process.exit(1);
  }
}

if (!hardeningMigration.includes("revoke all on function private.handle_new_user() from public, anon, authenticated")) {
  console.error("handle_new_user: 클라이언트 역할의 직접 실행을 차단하지 않았습니다.");
  process.exit(1);
}

const rlsTest = fs.readFileSync("supabase/tests/rls.sql", "utf8");
for (const table of ["learning_sessions", "drafts", "turns", "concept_states", "learning_events"]) {
  if (!rlsTest.includes(`from public.${table}`)) {
    console.error(`${table}: 교차 사용자 RLS 음성 테스트가 없습니다.`);
    process.exit(1);
  }
}

console.log("비밀값·RLS 정적 보안 검사 통과");
