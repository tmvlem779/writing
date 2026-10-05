import { SelfStudyWorkspace } from "@/components/self-study-workspace";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function SelfStudyPage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <header className="self-study-heading"><span>매일 문법 루틴</span><h1>하루 한 걸음, 문법 감각을 이어 가요</h1><p>문학 작품, 실생활 자료, 그림 속 상황을 매일 다른 방식으로 만나고 내 문장과 설명을 남깁니다.</p></header>
      <SelfStudyWorkspace />
    </section>
  );
}
