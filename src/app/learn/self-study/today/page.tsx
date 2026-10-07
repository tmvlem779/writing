import { DailyPracticeToday } from "@/components/daily-practice-today";
import { StudentLearningNav } from "@/components/student-learning-nav";

type TodayPracticePageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

export default async function TodayPracticePage({ searchParams }: TodayPracticePageProps) {
  const requestedDate = (await searchParams).date;
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <DailyPracticeToday requestedDate={typeof requestedDate === "string" ? requestedDate : undefined} />
    </section>
  );
}
