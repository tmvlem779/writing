"use client";

import { useState } from "react";
import { ConceptChapter } from "@/components/concept-chapter";
import { PracticeChapter } from "@/components/practice-chapter";
import { RealLifeChapter } from "@/components/real-life-chapter";
import {
  fiveLessonCourse,
  getCourseLesson,
  type CourseLessonNumber
} from "@/lib/curriculum/five-lesson-course";

type Chapter = "concept" | "practice" | "real-life";

export function WritingStudio() {
  const [lessonNumber, setLessonNumber] = useState<CourseLessonNumber>(1);
  const [chapter, setChapter] = useState<Chapter>("concept");
  const lesson = getCourseLesson(lessonNumber);

  return (
    <main className="learning-studio">
      <section className="course-map" aria-labelledby="course-map-title">
        <header>
          <div>
            <span>문장의 구조와 확장 · 총 5차시</span>
            <h1 id="course-map-title">오늘 배울 차시를 선택하세요</h1>
          </div>
          <p><strong>{lessonNumber}차시 핵심 질문</strong>{lesson.keyQuestion}</p>
        </header>
        <div className="lesson-switcher" role="group" aria-label="수업 차시 선택">
          {fiveLessonCourse.map((item) => (
            <button
              aria-pressed={lessonNumber === item.number}
              className={lessonNumber === item.number ? "lesson-tab active" : "lesson-tab"}
              key={item.number}
              onClick={() => setLessonNumber(item.number)}
              type="button"
            >
              <span>{item.number}차시</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
        <div className="lesson-activity-summary" aria-label={`${lessonNumber}차시 주요 활동`}>
          <span>주요 활동</span>
          <ol>
            {lesson.activities.map((activity) => <li key={activity}>{activity}</li>)}
          </ol>
        </div>
      </section>

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
        <button
          aria-current={chapter === "real-life" ? "page" : undefined}
          className={chapter === "real-life" ? "chapter-tab active" : "chapter-tab"}
          onClick={() => setChapter("real-life")}
          type="button"
        >
          <span>Chapter 03</span>
          <strong>실생활 탐구</strong>
          <small>실제적인 자료를 분석하고 고쳐 써요</small>
        </button>
      </nav>

      {chapter === "concept" && <ConceptChapter key={`concept-${lessonNumber}`} lessonNumber={lessonNumber} onStartPractice={() => setChapter("practice")} />}
      {chapter === "practice" && <PracticeChapter key={`practice-${lessonNumber}`} lessonNumber={lessonNumber} />}
      {chapter === "real-life" && <RealLifeChapter key={`real-life-${lessonNumber}`} lessonNumber={lessonNumber} />}
    </main>
  );
}
