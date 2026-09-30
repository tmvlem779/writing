import { SelfStudyWorkspace } from "@/components/self-study-workspace";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function SelfStudyPage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <header className="self-study-heading"><span>스스로 유형 학습</span><h1>문학과 실생활의 문장을 따로, 깊게 익혀요</h1><p>시에서는 문법 요소와 표현 효과를, 소설에서는 겹문장 구조를 탐구하고, 실생활 자료에서는 목적과 독자에 맞게 문장을 분석·변형합니다.</p></header>
      <SelfStudyWorkspace />
    </section>
  );
}
