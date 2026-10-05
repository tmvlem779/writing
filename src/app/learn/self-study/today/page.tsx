import { DailyPracticeToday } from "@/components/daily-practice-today";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function TodayPracticePage() {
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <DailyPracticeToday />
    </section>
  );
}
