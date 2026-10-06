import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { grammarDiagnosticQuestions, scoreDiagnosticAnswers } from "../src/lib/diagnosis/grammar-diagnostic.ts";
import { situationScenes } from "../src/lib/curriculum/situation-writing.ts";
import { getCourseLesson, getCourseLessons } from "../src/lib/curriculum/five-lesson-course.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const dashboard = read("src/app/learn/page.tsx");
const nav = read("src/components/student-learning-nav.tsx");
const diagnosisPage = read("src/app/learn/diagnosis/page.tsx");
const challengePage = read("src/app/learn/challenge/page.tsx");
const selfStudyPage = read("src/app/learn/self-study/page.tsx");
const selfStudyWorkspace = read("src/components/self-study-workspace.tsx");
const todayPracticePage = read("src/app/learn/self-study/today/page.tsx");
const dailyPracticeToday = read("src/components/daily-practice-today.tsx");
const conceptLearningActivity = read("src/components/concept-learning-activity.tsx");
const situationWritingActivity = read("src/components/situation-writing-activity.tsx");
const realLifeChapter = read("src/components/real-life-chapter.tsx");
const wrongNotesPage = read("src/app/learn/wrong-notes/page.tsx");
const diagnosisApi = read("src/app/api/diagnosis/route.ts");
const agentTurnApi = read("src/app/api/agent/turn/route.ts");
const migration = read("supabase/migrations/202609280003_add_wrong_answers.sql");
const layout = read("src/app/layout.tsx");
const styles = read("src/app/globals.css");
const learnLayout = read("src/app/learn/layout.tsx");
const learningBookShell = read("src/components/learning-book-shell.tsx");
const writingStudio = read("src/components/writing-studio.tsx");
const conceptChapter = read("src/components/concept-chapter.tsx");
const practiceChapter = read("src/components/practice-chapter.tsx");

test("ver.2 학생 학습 홈과 공통 탭에서는 AI 진단평가를 제외한다", () => {
  for (const [label, href] of [
    ["오늘의 챌린지", "/learn/challenge"],
    ["스스로 유형 학습", "/learn/self-study"],
    ["오답노트", "/learn/wrong-notes"]
  ]) {
    assert.match(dashboard, new RegExp(label));
    assert.match(nav, new RegExp(href));
  }
  assert.doesNotMatch(dashboard, /title: "AI 진단평가"/);
  assert.doesNotMatch(nav, /label: "AI 진단평가"/);
  assert.doesNotMatch(dashboard, /href: "\/learn\/diagnosis"/);
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

test("오늘의 챌린지는 6차시 수업을, 스스로 유형 학습은 매일 다른 유형의 로드맵으로 제공한다", () => {
  assert.match(challengePage, /WritingStudio/);
  assert.match(selfStudyPage, /SelfStudyWorkspace/);
  assert.match(selfStudyWorkspace, /7일 문법 루틴/);
  assert.match(selfStudyWorkspace, /buildDailyRoadmap/);
  assert.match(selfStudyWorkspace, /getDailyPracticePlan/);
  assert.match(selfStudyWorkspace, /href="\/learn\/self-study\/today"/);
  assert.doesNotMatch(selfStudyWorkspace, /target="_blank"/);
  assert.doesNotMatch(selfStudyWorkspace, /새 탭에서/);
  assert.doesNotMatch(selfStudyWorkspace, /문학 작품, 실생활 자료, 문장 만들기, 개념학습을 매일 복불복으로 만납니다/);
  assert.doesNotMatch(selfStudyWorkspace, /SituationWritingActivity/);
  assert.match(todayPracticePage, /DailyPracticeToday/);
  assert.match(dailyPracticeToday, /SituationWritingActivity/);
  assert.match(dailyPracticeToday, /ConceptLearningActivity/);
  assert.match(dailyPracticeToday, /todayPlan\.type === "concept-learning"/);
  assert.match(dailyPracticeToday, /todayPlan\.type === "sentence-making"/);
  assert.match(dailyPracticeToday, /onDailyComplete=\{completeToday\}/);
  assert.match(dailyPracticeToday, /showOverview=\{false\}/);
  assert.match(dailyPracticeToday, /일 연속 학습/);
  assert.match(selfStudyPage, /하루 한 걸음, 문법 감각을 이어 가요/);
});

test("P3: 스스로 확인하기 질문은 선택지와 같은 카드 안에 표시된다", () => {
  assert.match(conceptChapter, /className="concept-check-legend"/);
  assert.match(conceptChapter, /className="concept-check-question"/);
  assert.match(conceptChapter, /<strong>\{currentCheck\.prompt\}<\/strong>/);
  assert.match(styles, /\.concept-check-legend \{[^}]*position: absolute;[^}]*clip: rect\(0 0 0 0\)/s);
  assert.match(styles, /\.concept-check-question \{[^}]*display: grid;/s);
});

test("P1·P5: 확인 문제는 세 문항의 최초 정오답을 요약하고 오답을 다시 풀게 한다", () => {
  assert.match(conceptChapter, /firstAttemptResults/);
  assert.match(conceptChapter, /1차 결과/);
  assert.match(conceptChapter, /오답 다시 풀기/);
  assert.match(conceptChapter, /다음 오답 풀기/);
  assert.match(conceptChapter, /먼저 세 문항에 모두 답한 뒤 정오답을 확인해요/);
});

test("P1: 챕터 2는 도움 없이 제출과 AI 힌트를 분리하고 제출 뒤 입력을 비운다", () => {
  assert.match(practiceChapter, /sendTurn\("submit"\)/);
  assert.match(practiceChapter, /sendTurn\("hint"\)/);
  assert.match(practiceChapter, /"AI 힌트"/);
  assert.match(practiceChapter, /: "제출"/);
  assert.match(practiceChapter, /if \(supportMode === "submit"\) setDraft\(""\)/);
  assert.doesNotMatch(practiceChapter, /질문과 힌트 받기/);
});

test("P1·P3: 챕터 2는 불필요한 수치를 숨기고 숙달되면 질문을 끝낸다", () => {
  assert.doesNotMatch(practiceChapter, /시도 횟수|대화 기록|현재 도움 단계/);
  assert.doesNotMatch(practiceChapter, /className="evidence-panel"/);
  assert.match(practiceChapter, /response\.activityComplete/);
  assert.match(practiceChapter, /활동 완료/);
  assert.match(practiceChapter, /다음 활동으로/);
  assert.match(practiceChapter, /\[활동 완료 기준\]/);
});

test("P1·DATA: 오늘의 챌린지 진행을 계정별로 복원하고 완료 활동도 다시 풀 수 있다", () => {
  assert.match(writingStudio, /fetch\("\/api\/challenge-progress"/);
  assert.match(writingStudio, /progressHydrated/);
  assert.match(writingStudio, /initialCompletedActivityIds/);
  assert.match(writingStudio, /initialActivityId/);
  assert.match(writingStudio, /onProgressChange=\{updatePracticeProgress\}/);
  assert.match(practiceChapter, /initialCompletedActivityIds/);
  assert.match(practiceChapter, /onProgressChange\?\./);
  assert.match(conceptChapter, /1장 다시 풀기/);
  assert.match(conceptChapter, /restartChapter/);
  assert.match(conceptChapter, /const chapterUnlocked = completed \|\| chapterComplete/);
});

test("P3: 완료된 AI 활동에서는 다음 과제를 요구하는 윗문장을 숨긴다", () => {
  assert.match(practiceChapter, /!response\.activityComplete && <p>\{response\.studentMessage\}<\/p>/);
});

test("P2·P3: 챕터 2는 참고 중인 학생 문장을 밝히고 생성 뒤 같은 분석을 반복하지 않는다", () => {
  const firstLesson = getCourseLesson(1, "grammar");
  const creation = firstLesson.practiceActivities.find((activity) => activity.id === "grammar-simple-create");
  const explanation = firstLesson.practiceActivities.find((activity) => activity.id === "grammar-simple-explain");
  assert.match(creation?.completionCriterion ?? "", /문장 성분 분석은 다음 활동/);
  assert.equal(explanation?.usesAnswerFrom, "grammar-simple-create");
  assert.match(practiceChapter, /AI가 참고한 내 답/);
  assert.match(practiceChapter, /앞 활동에서 만든 문장/);
  assert.match(practiceChapter, /sourceAnswer/);
  assert.match(practiceChapter, /Chapter 02 · \{lessonNumber\}\/\{lessonCount\}/);
  assert.match(practiceChapter, /\{lessonNumber\}\/\{lessonCount\} · \{selected\.label\}/);
  const dependentActivities = getCourseLessons("grammar")
    .flatMap((lesson) => lesson.practiceActivities)
    .filter((activity) => /앞의 ‘/.test(activity.prompt));
  assert.ok(dependentActivities.length >= 6);
  assert.ok(dependentActivities.every((activity) => activity.usesAnswerFrom));
});

test("MOBILE: 핵심 학습 화면과 답 제출 영역은 좁은 화면에서 한 열로 재배치된다", () => {
  assert.match(styles, /\.concept-header, \.material-header, \.workspace-header \{ display: grid;/);
  assert.match(styles, /\.editor-actions \{ width: 100%; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(styles, /\.check-result-summary ol \{ grid-template-columns: 1fr;/);
});

test("스스로 유형 학습 로드맵은 그림과 제목이 겹치지 않도록 방향별 간격을 둔다", () => {
  assert.match(styles, /\.daily-path-step\.offset-1 \.daily-path-copy \{[^}]*padding-left: 34px;/s);
  assert.match(styles, /\.daily-path-step\.offset-2 \.daily-path-copy \{[^}]*justify-self: end;[^}]*transform: translateX\(clamp\(80px, 10vw, 140px\)\);/s);
  assert.match(styles, /\.daily-path-step \.daily-path-copy \{[^}]*margin-right: 0;[^}]*padding-left: 0;[^}]*transform: none;/s);
});

test("학생 학습 탭은 별도 책장 애니메이션 없이 즉시 이동한다", () => {
  assert.match(learnLayout, /LearningBookShell/);
  assert.match(learningBookShell, /className="learning-book-shell"/);
  assert.doesNotMatch(nav, /useBookTurn|turnTo\(/);
  assert.doesNotMatch(learningBookShell, /book-turn-transition|rotateY|setTimeout/);
});

test("P1·P3·P5: 개념학습은 첫 답 뒤 오답에만 단서를 주고 정답을 찾으면 하루 학습을 완료한다", () => {
  assert.match(conceptLearningActivity, /getDiagnosticQuestion/);
  assert.match(conceptLearningActivity, /question\.retryHint/);
  assert.match(conceptLearningActivity, /if \(!correct\)/);
  assert.match(conceptLearningActivity, /먼저 내 힘으로 판단해 보세요\. 틀린 뒤에만 단서가 열립니다/);
  assert.match(conceptLearningActivity, /sourceLabel: "스스로 유형 학습 · 개념학습"/);
  assert.match(conceptLearningActivity, /onDailyComplete\?\.\(sessionId\)/);
  assert.doesNotMatch(conceptLearningActivity, /AI 진단평가/);
});

test("P2·P3·P4: 그림 없이 글로 제시한 상황에서 학생이 먼저 문장을 만들고 질문을 이어 간다", () => {
  assert.equal(situationScenes.length, 3);
  assert.ok(situationScenes.every((scene) => scene.setting.length >= 45));
  assert.ok(situationScenes.every((scene) => scene.firstCondition.length > 20));
  assert.ok(situationScenes.every((scene) => !scene.firstCondition.includes("그림")));
  assert.doesNotMatch(situationWritingActivity, /<svg|SituationIllustration|role="img"|situation-figure|그림 관찰/);
  assert.match(situationWritingActivity, /className="situation-prompt"/);
  assert.match(situationWritingActivity, /\[스스로 유형 학습 · 상황으로 문장 만들기\]/);
  assert.match(situationWritingActivity, /내가 만든 문장/);
  assert.match(situationWritingActivity, /문장 보내고 질문 받기/);
  assert.match(situationWritingActivity, /activity: "create"/);
  assert.match(situationWritingActivity, /\[학생이 만든 문장\]/);
  assert.match(situationWritingActivity, /AI 학습 도우미/);
  assert.match(situationWritingActivity, /고친 문장 다시 보내기/);
  assert.doesNotMatch(situationWritingActivity, /모범 답안|정답 문장:/);
  assert.ok(situationWritingActivity.indexOf('className="coach-card situation-coach"') < situationWritingActivity.indexOf('htmlFor="situation-sentence"'));
  assert.match(styles, /\.situation-writing-shell/);
  assert.match(styles, /\.situation-prompt/);
  assert.doesNotMatch(styles, /\.situation-illustration|\.situation-figure/);
});

test("DATA: 그림 없는 상황 문장 생성 규칙은 프롬프트 v17로 추적한다", () => {
  const migration = read("supabase/migrations/202610070001_add_text_situation_prompt.sql");
  assert.match(migration, /writing-tutor-v17/);
  assert.match(migration, /text-only-situation-sentence-generation/);
});

test("P3·P4: 시는 문법 요소를 고르고 소설은 모든 문장에 직접 표시하고 답한다", () => {
  assert.match(realLifeChapter, /시에서 표현 효과를 만드는 문법 요소가 드러난 구절을 고르시오/);
  assert.match(realLifeChapter, /작품의 모든 문장을 차례로 살펴보고, 문장 구조의 단서에 밑줄을 그으시오/);
  assert.match(realLifeChapter, /isPoem/);
  assert.match(realLifeChapter, /문법 요소 탐구 구절/);
  assert.match(realLifeChapter, /novelSentenceIndex/);
  assert.match(realLifeChapter, /completedNovelSentenceIndexes/);
  assert.match(realLifeChapter, /markedNovelTokenIndexes/);
  assert.match(realLifeChapter, /novelStructureOptions/);
  assert.match(realLifeChapter, /novel-sentence-progress-list/);
  assert.match(realLifeChapter, /novel-token marked/);
  assert.match(realLifeChapter, /잘 모르겠어요/);
  assert.match(realLifeChapter, /한 가지 내용/);
  assert.match(realLifeChapter, /둘 이상의 내용/);
  assert.match(realLifeChapter, /selectedSentences/);
  assert.match(realLifeChapter, /submitLiteratureSelection/);
  assert.match(realLifeChapter, /prepareNovelQuestion/);
  assert.match(realLifeChapter, /advanceNovelSentence/);
  assert.match(realLifeChapter, /selectNovelSentence/);
  assert.match(realLifeChapter, /novelSentenceWork/);
  assert.match(realLifeChapter, /표시 완료하고 질문 보기/);
  assert.match(realLifeChapter, /답 보내고 이 문장 완료/);
  assert.match(realLifeChapter, /다음 문장으로/);
  assert.match(realLifeChapter, /모든 문장 활동을 마쳤어요/);
  assert.match(realLifeChapter, /모든 문장은 처음부터 열려 있습니다/);
  assert.match(realLifeChapter, /열어 보기/);
  assert.match(realLifeChapter, /summary-marked-token/);
  assert.match(realLifeChapter, /literatureSelectionSubmitted/);
  assert.match(styles, /\.novel-token\.marked/);
  assert.match(styles, /\.novel-sentence-progress-list/);
  assert.doesNotMatch(realLifeChapter, /literature-inline-draft/);
  assert.doesNotMatch(realLifeChapter, /표시할 문장을 먼저 고르세요/);
  assert.doesNotMatch(realLifeChapter, /차례를 기다려요/);
  assert.doesNotMatch(realLifeChapter, /작품에서 고른 문장과 구조 판단/);
  assert.doesNotMatch(styles, /literature-poem \.literature-sentence-list \{ grid-template-columns: repeat\(2/);
  assert.match(styles, /literature-poem \.literature-sentence-list \{ width: min\(100%, 720px\)/);
  assert.match(agentTurnApi, /grammarRealLifeMaterials/);
  assert.match(agentTurnApi, /removeTrustedCurriculumPassages/);
});

test("학생 홈은 산세리프 글꼴과 실제 데이터 기반 학습 현황을 제공한다", () => {
  assert.doesNotMatch(layout, /Noto_Serif_KR/);
  assert.match(layout, /Noto_Sans_KR/);
  assert.match(dashboard, /스스로 해결한 유형/);
  assert.match(dashboard, /도움이 필요한 영역/);
  assert.match(dashboard, /현재 비계 수준/);
  assert.match(dashboard, /추천 다음 활동/);
  assert.match(dashboard, /scaffoldLabel/);
  assert.match(styles, /learning-status-list/);
  assert.match(styles, /hunminjeongeum-glyphs\.png/);
});

test("학생 학습 정보 구조는 비대칭 홈과 번호형 상단 탭, 편집형 차시 목차를 사용한다", () => {
  assert.match(dashboard, /dashboard-card-\$\{index \+ 1\}/);
  assert.match(dashboard, /dashboard-card-index/);
  assert.match(nav, /student-learning-tabs/);
  assert.match(nav, /student-learning-index/);
  assert.match(nav, /note: "배우기"/);
  assert.match(writingStudio, /course-map-feature/);
  assert.match(writingStudio, /course-feature-art/);
  assert.match(writingStudio, /오늘의<br \/>챌린지/);
  assert.match(writingStudio, /\{lessonNumber\} \/ \{courseLessons\.length\}/);
  assert.match(writingStudio, /1: "기본"/);
  assert.match(writingStudio, /2: "연결"/);
  assert.match(writingStudio, /3: "확장"/);
  assert.match(writingStudio, /4: "표현"/);
  assert.match(writingStudio, /5: "변형"/);
  assert.match(writingStudio, /6: "활용"/);
  assert.match(writingStudio, /<strong>핵심 질문<\/strong>/);
  assert.doesNotMatch(writingStudio, /<strong>\{lessonNumber\}차시 핵심 질문<\/strong>/);
  assert.match(writingStudio, /course-map-index/);
  assert.match(styles, /--blue: #405965/);
  assert.match(styles, /--plum: #6f5664/);
  assert.match(styles, /\.student-dashboard-cards \{[^}]*grid-template-columns: minmax\(0, 1\.4fr\) minmax\(320px, \.75fr\)/s);
  assert.match(styles, /\.course-map-feature \{[^}]*grid-template-columns: minmax\(330px, \.78fr\) minmax\(540px, 1\.22fr\)/s);
});

test("PRIVACY: 오답은 학생별 RLS로 격리되고 오답노트는 로그인한 학생 행만 조회한다", () => {
  assert.match(migration, /alter table public\.wrong_answers enable row level security/);
  assert.match(migration, /user_id = auth\.uid\(\)/);
  assert.match(migration, /private\.is_teacher_of\(user_id\)/);
  assert.match(wrongNotesPage, /\.eq\("user_id", user\.id\)/);
});
