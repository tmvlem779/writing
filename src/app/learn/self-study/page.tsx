import { RealLifeChapter } from "@/components/real-life-chapter";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function SelfStudyPage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <header className="self-study-heading"><span>스스로 유형 학습</span><h1>실생활과 문학의 문장으로 유형을 익혀요</h1><p>보관해 둔 6차시 3장 자료에 문학 작품을 더해, 문장 구조와 문법 요소가 맥락과 정서에 미치는 효과를 탐구합니다.</p></header>
      <RealLifeChapter lessonNumber={6} trackId="grammar" />
    </section>
  );
}
