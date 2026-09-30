import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { grammarDiagnosticQuestions, scoreDiagnosticAnswers } from "../src/lib/diagnosis/grammar-diagnostic.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const dashboard = read("src/app/learn/page.tsx");
const nav = read("src/components/student-learning-nav.tsx");
const diagnosisPage = read("src/app/learn/diagnosis/page.tsx");
const challengePage = read("src/app/learn/challenge/page.tsx");
const selfStudyPage = read("src/app/learn/self-study/page.tsx");
const selfStudyWorkspace = read("src/components/self-study-workspace.tsx");
const realLifeChapter = read("src/components/real-life-chapter.tsx");
const wrongNotesPage = read("src/app/learn/wrong-notes/page.tsx");
const diagnosisApi = read("src/app/api/diagnosis/route.ts");
const agentTurnApi = read("src/app/api/agent/turn/route.ts");
const migration = read("supabase/migrations/202609280003_add_wrong_answers.sql");
const layout = read("src/app/layout.tsx");
const styles = read("src/app/globals.css");

test("학생 학습 홈은 네 학습 영역을 각각 독립 경로로 연결한다", () => {
  for (const [label, href] of [
    ["AI 진단평가", "/learn/diagnosis"],
    ["오늘의 챌린지", "/learn/challenge"],
    ["스스로 유형 학습", "/learn/self-study"],
    ["오답노트", "/learn/wrong-notes"]
  ]) {
    assert.match(dashboard, new RegExp(label));
    assert.match(nav, new RegExp(href));
  }
});

test("P1·P3: 진단평가는 문장 기초부터 맥락과 의미까지 8문항으로 파악한다", () => {
  assert.equal(grammarDiagnosticQuestions.length, 8);
  assert.deepEqual([...new Set(grammarDiagnosticQuestions.map((item) => item.domain))], ["문장 기초", "문장 확대", "문법 요소", "맥락과 의미"]);
  assert.ok(grammarDiagnosticQuestions.every((item) => item.options.length === 4));
  assert.equal(scoreDiagnosticAnswers(Object.fromEntries(grammarDiagnosticQuestions.map((item) => [item.id, item.answer]))), 8);
  assert.match(diagnosisPage, /GrammarDiagnostic/);
  assert.match(diagnosisApi, /event_type: "diagnostic_completed"/);
  assert.match(diagnosisApi, /status: "completed"/);
});

test("P1·P3: 진단 오답은 정답을 즉시 공개하지 않고 관찰 단서를 제공한다", () => {
  for (const question of grammarDiagnosticQuestions) {
    const answerLabel = question.options.find((option) => option.id === question.answer)?.label ?? "";
    assert.ok(question.retryHint.length > 10);
    assert.notEqual(question.retryHint, question.explanation);
    assert.equal(question.retryHint.includes(answerLabel), false);
  }
});

test("오늘의 챌린지는 6차시 수업을, 스스로 유형 학습은 문학·실생활 자료를 분리한다", () => {
  assert.match(challengePage, /WritingStudio/);
  assert.match(selfStudyPage, /SelfStudyWorkspace/);
  assert.match(selfStudyWorkspace, /문학 작품/);
  assert.match(selfStudyWorkspace, /실생활 자료/);
  assert.match(selfStudyWorkspace, /materialGroup=\{activeGroup\}/);
  assert.match(selfStudyWorkspace, /showOverview=\{false\}/);
  assert.match(selfStudyPage, /시에서는 문법 요소와 표현 효과를/);
  assert.match(selfStudyPage, /소설에서는 겹문장 구조를/);
});

test("P3·P4: 시는 문법 요소를 고르고 소설은 문장 안의 연결 표현을 직접 표시한다", () => {
  assert.match(realLifeChapter, /시에서 표현 효과를 만드는 문법 요소가 드러난 구절을 고르시오/);
  assert.match(realLifeChapter, /겹문장이라고 생각하는 문장 하나를 고른 뒤, 이어 주는 표현에 밑줄을 그으시오/);
  assert.match(realLifeChapter, /isPoem/);
  assert.match(realLifeChapter, /문법 요소 탐구 구절/);
  assert.match(realLifeChapter, /markedNovelTokenIndexes/);
  assert.match(realLifeChapter, /novelRelationOptions/);
  assert.match(realLifeChapter, /novel-token marked/);
  assert.match(realLifeChapter, /잘 모르겠어요/);
  assert.match(realLifeChapter, /selectedSentences/);
  assert.match(realLifeChapter, /submitLiteratureSelection/);
  assert.match(realLifeChapter, /표시 완료하고 확인받기/);
  assert.match(realLifeChapter, /내 밑줄 표시를 바탕으로 한 질문/);
  assert.match(realLifeChapter, /summary-marked-token/);
  assert.match(realLifeChapter, /literatureSelectionSubmitted/);
  assert.match(styles, /\.novel-token\.marked/);
  assert.doesNotMatch(realLifeChapter, /literature-inline-draft/);
  assert.doesNotMatch(realLifeChapter, /작품에서 고른 문장과 구조 판단/);
  assert.doesNotMatch(styles, /literature-poem \.literature-sentence-list \{ grid-template-columns: repeat\(2/);
  assert.match(styles, /literature-poem \.literature-sentence-list \{ width: min\(100%, 720px\)/);
  assert.match(agentTurnApi, /grammarRealLifeMaterials/);
  assert.match(agentTurnApi, /removeTrustedCurriculumPassages/);
});

test("학생 홈은 둥근 브랜드 글꼴과 실제 데이터 기반 학습 현황을 제공한다", () => {
  assert.match(layout, /Jua/);
  assert.match(layout, /Noto_Sans_KR/);
  assert.match(dashboard, /스스로 해결한 유형/);
  assert.match(dashboard, /도움이 필요한 영역/);
  assert.match(dashboard, /현재 비계 수준/);
  assert.match(dashboard, /추천 다음 활동/);
  assert.match(dashboard, /scaffoldLabel/);
  assert.match(styles, /learning-status-list/);
});

test("PRIVACY: 오답은 학생별 RLS로 격리되고 오답노트는 로그인한 학생 행만 조회한다", () => {
  assert.match(migration, /alter table public\.wrong_answers enable row level security/);
  assert.match(migration, /user_id = auth\.uid\(\)/);
  assert.match(migration, /private\.is_teacher_of\(user_id\)/);
  assert.match(wrongNotesPage, /\.eq\("user_id", user\.id\)/);
});
