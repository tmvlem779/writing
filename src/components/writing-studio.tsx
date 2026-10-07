"use client";

import { useEffect, useRef, useState } from "react";
import { ConceptChapter } from "@/components/concept-chapter";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { PracticeChapter } from "@/components/practice-chapter";
import { RealLifeChapter } from "@/components/real-life-chapter";
import {
  getCourseLesson,
  getCourseLessons,
  type CourseLessonNumber,
  type CourseTrackId
} from "@/lib/curriculum/five-lesson-course";
import type { ChallengeProgressInput, ChallengeProgressRecord } from "@/lib/learning/challenge-progress";

type Chapter = "concept" | "practice" | "real-life";
type ProgressByLesson = Partial<Record<CourseLessonNumber, ChallengeProgressRecord>>;

export function WritingStudio() {
  const trackId: CourseTrackId = "grammar";
  const [lessonNumber, setLessonNumber] = useState<CourseLessonNumber>(1);
  const [chapter, setChapter] = useState<Chapter>("concept");
  const [progressByLesson, setProgressByLesson] = useState<ProgressByLesson>({});
  const progressRef = useRef<ProgressByLesson>({});
  const progressSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [progressError, setProgressError] = useState("");
  const courseLessons = getCourseLessons(trackId);
  const lesson = getCourseLesson(lessonNumber, trackId);
  const hasRealLifeChapter = lesson.realLifeMaterialIds.length > 0;
  const currentProgress = progressByLesson[lessonNumber];
  const isConceptComplete = currentProgress?.conceptCompleted ?? false;

  useEffect(() => {
    let cancelled = false;
    async function restoreProgress() {
      try {
        const result = await fetch("/api/challenge-progress", { cache: "no-store" });
        const body = await result.json();
        if (!result.ok) throw new Error(body.error ?? "학습 진행 상황을 불러오지 못했습니다.");
        if (cancelled) return;
        const records = (body.progress ?? []) as ChallengeProgressRecord[];
        const nextProgress: ProgressByLesson = {};
        for (const record of records) {
          if (record.trackId === trackId && record.lessonNumber >= 1 && record.lessonNumber <= 6) {
            nextProgress[record.lessonNumber as CourseLessonNumber] = record;
          }
        }
        progressRef.current = nextProgress;
        setProgressByLesson(nextProgress);
        const latest = records.find((record) => record.trackId === trackId);
        if (latest && latest.lessonNumber >= 1 && latest.lessonNumber <= 6) {
          const restoredLesson = latest.lessonNumber as CourseLessonNumber;
          const restoredCourseLesson = getCourseLesson(restoredLesson, trackId);
          const canOpenRealLife = restoredCourseLesson.realLifeMaterialIds.length > 0;
          const restoredChapter = !latest.conceptCompleted && latest.lastChapter === "practice"
            ? "concept"
            : latest.lastChapter === "real-life" && !canOpenRealLife
              ? "concept"
              : latest.lastChapter;
          setLessonNumber(restoredLesson);
          setChapter(restoredChapter);
        }
      } catch (caught) {
        if (!cancelled) setProgressError(caught instanceof Error ? caught.message : "학습 진행 상황을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setProgressHydrated(true);
      }
    }
    void restoreProgress();
    return () => { cancelled = true; };
  }, []);

  async function persistProgress(progress: ChallengeProgressInput) {
    try {
      const result = await fetch("/api/challenge-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
        keepalive: true
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "학습 진행 상황을 저장하지 못했습니다.");
      setProgressError("");
    } catch (caught) {
      setProgressError(caught instanceof Error ? caught.message : "학습 진행 상황을 저장하지 못했습니다.");
    }
  }

  function updateStoredProgress(targetLesson: CourseLessonNumber, patch: Partial<ChallengeProgressInput>) {
    const previous = progressRef.current[targetLesson];
    const next: ChallengeProgressRecord = {
      trackId,
      lessonNumber: targetLesson,
      conceptCompleted: previous?.conceptCompleted ?? false,
      completedActivityIds: previous?.completedActivityIds ?? [],
      lastChapter: previous?.lastChapter ?? "concept",
      lastActivityId: previous?.lastActivityId ?? null,
      updatedAt: new Date().toISOString(),
      ...patch
    };
    const nextProgress = { ...progressRef.current, [targetLesson]: next };
    progressRef.current = nextProgress;
    setProgressByLesson(nextProgress);
    progressSaveQueue.current = progressSaveQueue.current.then(() => persistProgress(next));
  }

  function selectLesson(nextLesson: CourseLessonNumber) {
    setLessonNumber(nextLesson);
    const nextLessonHasRealLifeChapter = getCourseLesson(nextLesson, trackId).realLifeMaterialIds.length > 0;
    const stored = progressByLesson[nextLesson];
    const nextConceptIsComplete = stored?.conceptCompleted ?? false;
    const nextChapter = stored?.lastChapter === "practice" && !nextConceptIsComplete
      ? "concept"
      : stored?.lastChapter === "real-life" && !nextLessonHasRealLifeChapter
        ? "concept"
        : stored?.lastChapter ?? "concept";
    setChapter(nextChapter);
    updateStoredProgress(nextLesson, { lastChapter: nextChapter });
  }

  function updateConceptCompletion(complete: boolean) {
    if (!complete) return;
    updateStoredProgress(lessonNumber, { conceptCompleted: true });
  }

  function openChapter(nextChapter: Chapter) {
    setChapter(nextChapter);
    updateStoredProgress(lessonNumber, { lastChapter: nextChapter });
  }

  function updatePracticeProgress(completedActivityIds: string[], lastActivityId: string) {
    updateStoredProgress(lessonNumber, {
      completedActivityIds,
      lastActivityId,
      lastChapter: "practice"
    });
  }

  if (!progressHydrated) {
    return <div className="challenge-progress-loading" aria-label="학습 진행 상황 불러오기"><MondeukLoading /></div>;
  }

  return (
    <div className="learning-studio">
      {progressError && <div className="error-panel challenge-progress-error" role="alert">{progressError}</div>}
      <section className="course-map" aria-labelledby="course-map-title">
        <div className="course-map-feature">
          <header>
            <span>{lessonNumber} / {courseLessons.length}</span>
            <h1 id="course-map-title">오늘의<br />챌린지</h1>
            <p>문장의 구조를 읽고, 표시하고, 직접 쓰는 여섯 번의 탐구</p>
          </header>
          <div className="course-feature-art" aria-hidden="true">
            <span>{String(lessonNumber).padStart(2, "0")}</span>
            <i>語</i>
          </div>
          <p className="course-key-question">
            <strong>핵심 질문</strong>
            {lesson.keyQuestion}
          </p>
        </div>
        <div className="course-map-index">
          <div className="lesson-switcher six-lessons" role="group" aria-label="수업 차시 선택">
            {courseLessons.map((item) => (
              <button
                aria-pressed={lessonNumber === item.number}
                className={lessonNumber === item.number ? "lesson-tab active" : "lesson-tab"}
                key={item.number}
                onClick={() => selectLesson(item.number)}
                type="button"
              >
                <span>{String(item.number).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
          <div className="lesson-activity-summary" aria-label={`${lessonNumber}차시 주요 활동`}>
            <span>오늘의 흐름</span>
            <ol>
              {lesson.activities.map((activity) => <li key={activity}>{activity}</li>)}
            </ol>
          </div>
        </div>
      </section>

      <nav className={hasRealLifeChapter ? "chapter-switcher" : "chapter-switcher two-chapters"} aria-label="학습 장 선택">
        <button
          aria-current={chapter === "concept" ? "page" : undefined}
          className={chapter === "concept" ? "chapter-tab active" : "chapter-tab"}
          onClick={() => openChapter("concept")}
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
          onClick={() => openChapter("practice")}
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
            onClick={() => openChapter("real-life")}
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
          onCompletionChange={updateConceptCompletion}
          onStartPractice={() => openChapter("practice")}
          trackId={trackId}
        />
      )}
      {chapter === "practice" && (
        <PracticeChapter
          initialActivityId={currentProgress?.lastActivityId}
          initialCompletedActivityIds={currentProgress?.completedActivityIds ?? []}
          key={`practice-${trackId}-${lessonNumber}`}
          lessonNumber={lessonNumber}
          onProgressChange={updatePracticeProgress}
          trackId={trackId}
        />
      )}
      {chapter === "real-life" && hasRealLifeChapter && (
        <RealLifeChapter key={`real-life-${trackId}-${lessonNumber}`} lessonNumber={lessonNumber} trackId={trackId} />
      )}
    </div>
  );
}
