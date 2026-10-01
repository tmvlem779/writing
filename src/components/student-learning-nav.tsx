import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export type StudentSection = "diagnosis" | "challenge" | "self-study" | "wrong-notes";

const sections = [
  { id: "challenge", href: "/learn/challenge", label: "오늘의 챌린지" },
  { id: "self-study", href: "/learn/self-study", label: "스스로 유형 학습" },
  { id: "wrong-notes", href: "/learn/wrong-notes", label: "오답노트" }
] as const satisfies ReadonlyArray<{ id: StudentSection; href: "/learn/challenge" | "/learn/self-study" | "/learn/wrong-notes"; label: string }>;

export function StudentLearningNav({ active }: { active: StudentSection }) {
  return (
    <nav className="student-learning-nav" aria-label="학생 학습 영역">
      <BrandLogo className="student-learning-home" href="/learn" />
      <div>
        {sections.map((section) => (
          <Link aria-current={active === section.id ? "page" : undefined} className={active === section.id ? "active" : ""} href={section.href} key={section.id}>
            {section.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
