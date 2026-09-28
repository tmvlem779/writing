"use client";

import { useState } from "react";
import { ConceptChapter } from "@/components/concept-chapter";
import { PracticeChapter } from "@/components/practice-chapter";
import { RealLifeChapter } from "@/components/real-life-chapter";
import {
  getCourseLesson,
  getCourseLessons,
  getCourseTrack,
  type CourseLessonNumber,
  type CourseTrackId
} from "@/lib/curriculum/five-lesson-course";

type Chapter = "concept" | "practice" | "real-life";

export function WritingStudio() {
  const trackId: CourseTrackId = "grammar";
  const [lessonNumber, setLessonNumber] = useState<CourseLessonNumber>(1);
  const [chapter, setChapter] = useState<Chapter>("concept");
  const [completedConcepts, setCompletedConcepts] = useState<Set<string>>(new Set());
  const track = getCourseTrack(trackId);
  const courseLessons = getCourseLessons(trackId);
  const lesson = getCourseLesson(lessonNumber, trackId);
  const hasRealLifeChapter = lesson.realLifeMaterialIds.length > 0;
  const conceptCompletionKey = `${trackId}:${lessonNumber}`;
  const isConceptComplete = completedConcepts.has(conceptCompletionKey);

  function selectLesson(nextLesson: CourseLessonNumber) {
    setLessonNumber(nextLesson);
    const nextLessonHasRealLifeChapter = getCourseLesson(nextLesson, trackId).realLifeMaterialIds.length > 0;
    const nextConceptIsComplete = completedConcepts.has(`${trackId}:${nextLesson}`);
    if (chapter === "practice" && !nextConceptIsComplete) setChapter("concept");
    if (chapter === "real-life" && !nextLessonHasRealLifeChapter) setChapter("concept");
  }

  function completeConcept() {
    setCompletedConcepts((current) => new Set(current).add(conceptCompletionKey));
  }

  return (
    <main className="learning-studio">
      <section className="course-map" aria-labelledby="course-map-title">
        <header>
          <div>
            <span>{track.optionLabel} · {track.title} · 총 {courseLessons.length}차시</span>
            <h1 id="course-map-title">{track.title} 수업안</h1>
          </div>
          <p>
            <strong>{lessonNumber}차시 핵심 질문</strong>
            {lesson.keyQuestion}
          </p>
        </header>
        <div className="lesson-switcher six-lessons" role="group" aria-label="수업 차시 선택">
          {courseLessons.map((item) => (
            <button
              aria-pressed={lessonNumber === item.number}
              className={lessonNumber === item.number ? "lesson-tab active" : "lesson-tab"}
              key={item.number}
              onClick={() => selectLesson(item.number)}
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

      <nav className={hasRealLifeChapter ? "chapter-switcher" : "chapter-switcher two-chapters"} aria-label="학습 장 선택">
        <button
          aria-current={chapter === "concept" ? "page" : undefined}
          className={chapter === "concept" ? "chapter-tab active" : "chapter-tab"}
          onClick={() => setChapter("concept")}
          type="button"
        >
          <span>Chapter 01</span>
          <strong>개념 학습</strong>
          <small>구조와 문법 요소를 관찰해요</small>
        </button>
        <button
          aria-current={chapter === "practice" ? "page" : undefined}
          className={chapter === "practice" ? "chapter-tab active" : isConceptComplete ? "chapter-tab" : "chapter-tab locked"}
          disabled={!isConceptComplete}
          onClick={() => setChapter("practice")}
          type="button"
        >
          <span>Chapter 02</span>
          <strong>쓰기와 성찰</strong>
          <small>{isConceptComplete ? "진단부터 글쓰기까지 연습해요" : "Chapter 01 확인 문제를 모두 통과하면 열려요"}</small>
        </button>
        {hasRealLifeChapter && (
          <button
            aria-current={chapter === "real-life" ? "page" : undefined}
            className={chapter === "real-life" ? "chapter-tab active" : "chapter-tab"}
            onClick={() => setChapter("real-life")}
            type="button"
          >
            <span>Chapter 03</span>
            <strong>종합 실생활 탐구</strong>
            <small>1~{lessonNumber - 1}차시 개념을 실제 자료에 적용해요</small>
          </button>
        )}
      </nav>

      {chapter === "concept" && (
        <ConceptChapter
          completed={isConceptComplete}
          key={`concept-${trackId}-${lessonNumber}`}
          lessonNumber={lessonNumber}
          onComplete={completeConcept}
          onStartPractice={() => setChapter("practice")}
          trackId={trackId}
        />
      )}
      {chapter === "practice" && <PracticeChapter key={`practice-${trackId}-${lessonNumber}`} lessonNumber={lessonNumber} trackId={trackId} />}
      {chapter === "real-life" && hasRealLifeChapter && (
        <RealLifeChapter key={`real-life-${trackId}-${lessonNumber}`} lessonNumber={lessonNumber} trackId={trackId} />
      )}
    </main>
  );
}
