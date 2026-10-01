import { SelfStudyWorkspace } from "@/components/self-study-workspace";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function SelfStudyPage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <header className="self-study-heading"><span>스스로 유형 학습</span><h1>읽고, 관찰하고, 내 문장으로 표현해요</h1><p>문학과 실생활 자료의 문장을 탐구하고, 그림 속 학교생활 상황을 관찰해 구조와 문법 요소가 드러나는 문장을 직접 만듭니다.</p></header>
      <SelfStudyWorkspace />
    </section>
  );
}
