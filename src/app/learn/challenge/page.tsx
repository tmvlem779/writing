import { StudentLearningNav } from "@/components/student-learning-nav";
import { WritingStudio } from "@/components/writing-studio";

export default function ChallengePage() {
  return <section className="student-activity-page"><StudentLearningNav active="challenge" /><WritingStudio /></section>;
}
