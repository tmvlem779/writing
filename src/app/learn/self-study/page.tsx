import { RealLifeChapter } from "@/components/real-life-chapter";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function SelfStudyPage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <header className="self-study-heading"><span>스스로 유형 학습</span><h1>실생활 문장으로 유형을 익혀요</h1><p>보관해 둔 6차시 3장 자료를 기사·안내문·대화·발표·인터뷰·학습자 SNS 유형별로 연습합니다.</p></header>
      <RealLifeChapter lessonNumber={6} trackId="grammar" />
    </section>
  );
}
