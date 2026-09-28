import { GrammarDiagnostic } from "@/components/grammar-diagnostic";
import { StudentLearningNav } from "@/components/student-learning-nav";

export default function DiagnosisPage() {
  return <section className="student-activity-page"><StudentLearningNav active="diagnosis" /><GrammarDiagnostic /></section>;
}
