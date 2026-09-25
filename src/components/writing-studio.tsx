"use client";

import { useState } from "react";
import { ConceptChapter } from "@/components/concept-chapter";
import { PracticeChapter } from "@/components/practice-chapter";

type Chapter = "concept" | "practice";

export function WritingStudio() {
  const [chapter, setChapter] = useState<Chapter>("concept");

  return (
    <main className="learning-studio">
      <nav className="chapter-switcher" aria-label="학습 장 선택">
        <button
          aria-current={chapter === "concept" ? "page" : undefined}
          className={chapter === "concept" ? "chapter-tab active" : "chapter-tab"}
          onClick={() => setChapter("concept")}
          type="button"
        >
          <span>Chapter 01</span>
          <strong>개념 학습</strong>
          <small>문장 구조를 관찰하고 이해해요</small>
        </button>
        <button
          aria-current={chapter === "practice" ? "page" : undefined}
          className={chapter === "practice" ? "chapter-tab active" : "chapter-tab"}
          onClick={() => setChapter("practice")}
          type="button"
        >
          <span>Chapter 02</span>
          <strong>쓰기와 성찰</strong>
          <small>진단부터 글쓰기까지 연습해요</small>
        </button>
      </nav>

      {chapter === "concept" ? (
        <ConceptChapter onStartPractice={() => setChapter("practice")} />
      ) : (
        <PracticeChapter />
      )}
    </main>
  );
}
