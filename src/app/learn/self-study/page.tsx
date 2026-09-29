import { SelfStudyWorkspace } from "@/components/self-study-workspace";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function SelfStudyPage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <header className="self-study-heading"><span>스스로 유형 학습</span><h1>문학과 실생활의 문장을 따로, 깊게 익혀요</h1><p>문학 작품에서는 겹문장을 모두 골라 선택을 바탕으로 질문을 이어 가고, 실생활 자료에서는 목적과 독자에 맞게 구조를 분석·변형합니다.</p></header>
      <SelfStudyWorkspace />
    </section>
  );
}
