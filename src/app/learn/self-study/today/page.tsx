import { DailyPracticeToday } from "@/components/daily-practice-today";
import { StudentLearningNav } from "@/components/student-learning-nav";
import { getKoreanDate, getSelectablePracticeDate } from "@/lib/learning/daily-practice";
import { redirect } from "next/navigation";

type TodayPracticePageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

export default async function TodayPracticePage({ searchParams }: TodayPracticePageProps) {
  const requestedDate = (await searchParams).date;
  const date = typeof requestedDate === "string" ? requestedDate : undefined;
  if (date && date !== getSelectablePracticeDate(date, getKoreanDate())) redirect("/learn/self-study");
  return (
    <section className="student-activity-page">
      <StudentLearningNav active="self-study" />
      <DailyPracticeToday requestedDate={date} />
    </section>
  );
}
