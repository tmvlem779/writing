"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { type BookSectionHref, useBookTurn } from "@/components/learning-book-shell";

export type StudentSection = "diagnosis" | "challenge" | "self-study" | "wrong-notes";

const sections = [
  { id: "challenge", href: "/learn/challenge", label: "오늘의 챌린지" },
  { id: "self-study", href: "/learn/self-study", label: "스스로 유형 학습" },
  { id: "wrong-notes", href: "/learn/wrong-notes", label: "오답노트" }
] as const satisfies ReadonlyArray<{ id: StudentSection; href: BookSectionHref; label: string }>;

export function StudentLearningNav({ active }: { active: StudentSection }) {
  const { turning, turnTo } = useBookTurn();

  function openBookSection(event: MouseEvent<HTMLAnchorElement>, href: BookSectionHref, label: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    turnTo(href, label);
  }

  return (
    <nav className="student-learning-nav" aria-label="학생 학습 영역">
      <BrandLogo className="student-learning-home" href="/learn" />
      <div>
        {sections.map((section) => (
          <Link aria-current={active === section.id ? "page" : undefined} aria-disabled={turning} className={active === section.id ? "active" : ""} href={section.href} key={section.id} onClick={(event) => openBookSection(event, section.href, section.label)}>
            {section.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
