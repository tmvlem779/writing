"use client";

import { useState } from "react";
import { ConceptChapter } from "@/components/concept-chapter";
import { PracticeChapter } from "@/components/practice-chapter";
import { RealLifeChapter } from "@/components/real-life-chapter";
import {
  courseTracks,
  grammarWingActivity,
  getCourseLesson,
  getCourseLessons,
  getCourseTrack,
  type CourseLessonNumber,
  type CourseTrackId
} from "@/lib/curriculum/five-lesson-course";

type Chapter = "concept" | "practice" | "real-life";

export function WritingStudio() {
  const [trackId, setTrackId] = useState<CourseTrackId>("structure");
  const [lessonNumber, setLessonNumber] = useState<CourseLessonNumber>(1);
  const [chapter, setChapter] = useState<Chapter>("concept");
  const track = getCourseTrack(trackId);
  const courseLessons = getCourseLessons(trackId);
  const lesson = getCourseLesson(lessonNumber, trackId);
  const isWing = trackId === "grammar" && chapter === "real-life";
  const visibleActivities = isWing ? grammarWingActivity.activities : lesson.activities;

  function selectTrack(nextTrack: CourseTrackId) {
    setTrackId(nextTrack);
    setLessonNumber(1);
    setChapter("concept");
  }

  function selectLesson(nextLesson: CourseLessonNumber) {
    setLessonNumber(nextLesson);
    if (chapter === "real-life") setChapter("concept");
  }

  function selectWing() {
    setLessonNumber(5);
    setChapter("real-life");
  }

  return (
    <main className="learning-studio">
      <section className="course-map" aria-labelledby="course-map-title">
        <div className="course-track-switcher" role="group" aria-label="비교할 수업안 선택">
          {courseTracks.map((item) => (
            <button
              aria-pressed={trackId === item.id}
              className={trackId === item.id ? "course-track-option active" : "course-track-option"}
              key={item.id}
              onClick={() => selectTrack(item.id)}
              type="button"
            >
              <span>{item.optionLabel} · {item.badge}</span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
        <header>
          <div>
            <span>{isWing ? "B안 · 별도 날개 활동" : `${track.optionLabel} · ${track.title} · 총 5차시`}</span>
            <h1 id="course-map-title">{isWing ? grammarWingActivity.title : `${track.title} 수업안`}</h1>
          </div>
          <p>
            <strong>{isWing ? "날개 핵심 질문" : `${lessonNumber}차시 핵심 질문`}</strong>
            {isWing ? grammarWingActivity.keyQuestion : lesson.keyQuestion}
          </p>
        </header>
        <div className={trackId === "grammar" ? "lesson-switcher with-wing" : "lesson-switcher"} role="group" aria-label="수업 차시와 날개 활동 선택">
          {courseLessons.map((item) => (
            <button
              aria-pressed={!isWing && lessonNumber === item.number}
              className={!isWing && lessonNumber === item.number ? "lesson-tab active" : "lesson-tab"}
              key={item.number}
              onClick={() => selectLesson(item.number)}
              type="button"
            >
              <span>{item.number}차시</span>
              <strong>{item.title}</strong>
            </button>
          ))}
          {trackId === "grammar" && (
            <button
              aria-pressed={isWing}
              className={isWing ? "lesson-tab wing-tab active" : "lesson-tab wing-tab"}
              onClick={selectWing}
              type="button"
            >
              <span>날개</span>
              <strong>실생활 탐구</strong>
              <small>5차시와 분리된 전이 활동</small>
            </button>
          )}
        </div>
        <div className="lesson-activity-summary" aria-label={isWing ? "날개 주요 활동" : `${lessonNumber}차시 주요 활동`}>
          <span>주요 활동</span>
          <ol>
            {visibleActivities.map((activity) => <li key={activity}>{activity}</li>)}
          </ol>
        </div>
      </section>

      {!isWing && <nav className={lessonNumber === 5 && trackId === "structure" ? "chapter-switcher" : "chapter-switcher two-chapters"} aria-label="학습 장 선택">
        <button
          aria-current={chapter === "concept" ? "page" : undefined}
          className={chapter === "concept" ? "chapter-tab active" : "chapter-tab"}
          onClick={() => setChapter("concept")}
          type="button"
        >
          <span>Chapter 01</span>
          <strong>개념 학습</strong>
          <small>{trackId === "grammar" ? "구조와 문법 요소를 관찰해요" : "문장 구조를 관찰하고 이해해요"}</small>
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
        {lessonNumber === 5 && trackId === "structure" && (
          <button
            aria-current={chapter === "real-life" ? "page" : undefined}
            className={chapter === "real-life" ? "chapter-tab active" : "chapter-tab"}
            onClick={() => setChapter("real-life")}
            type="button"
          >
            <span>Chapter 03</span>
            <strong>종합 실생활 탐구</strong>
            <small>1~4차시 개념을 실제 자료에 적용해요</small>
          </button>
        )}
      </nav>}

      {chapter === "concept" && <ConceptChapter key={`concept-${trackId}-${lessonNumber}`} lessonNumber={lessonNumber} trackId={trackId} onStartPractice={() => setChapter("practice")} />}
      {chapter === "practice" && <PracticeChapter key={`practice-${trackId}-${lessonNumber}`} lessonNumber={lessonNumber} trackId={trackId} />}
      {chapter === "real-life" && lessonNumber === 5 && (
        <RealLifeChapter key={`real-life-${trackId}-5`} lessonNumber={5} trackId={trackId} standalone={trackId === "grammar"} />
      )}
    </main>
  );
}
