"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { type BookSectionHref, useBookTurn } from "@/components/learning-book-shell";

export type StudentSection = "diagnosis" | "challenge" | "self-study" | "wrong-notes";

const sections = [
  { id: "challenge", href: "/learn/challenge", index: "01", label: "오늘의 챌린지", note: "배우기" },
  { id: "self-study", href: "/learn/self-study", index: "02", label: "스스로 유형 학습", note: "익히기" },
  { id: "wrong-notes", href: "/learn/wrong-notes", index: "03", label: "오답노트", note: "되짚기" }
] as const satisfies ReadonlyArray<{ id: StudentSection; href: BookSectionHref; index: string; label: string; note: string }>;

export function StudentLearningNav({ active }: { active: StudentSection }) {
  const { turning, turnTo } = useBookTurn();

  function openBookSection(event: MouseEvent<HTMLAnchorElement>, href: BookSectionHref, label: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    turnTo(href, label);
  }

  return (
    <nav className="student-learning-nav" aria-label="학생 학습 영역">
      <div className="student-learning-brand">
        <BrandLogo className="student-learning-home" href="/learn" />
        <span>문법 학습관</span>
      </div>
      <div className="student-learning-tabs">
        {sections.map((section) => (
          <Link aria-current={active === section.id ? "page" : undefined} aria-disabled={turning} className={active === section.id ? "active" : ""} href={section.href} key={section.id} onClick={(event) => openBookSection(event, section.href, section.label)}>
            <small>{section.index}</small>
            <strong>{section.label}</strong>
            <span>{section.note}</span>
          </Link>
        ))}
      </div>
      <Link className="student-learning-index" href="/learn">학습 홈 <span aria-hidden="true">↗</span></Link>
    </nav>
  );
}
