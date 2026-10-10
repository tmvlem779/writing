"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConceptLearningActivity } from "@/components/concept-learning-activity";
import { ErrorCorrectionActivity } from "@/components/error-correction-activity";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { RealLifeChapter } from "@/components/real-life-chapter";
import { SituationWritingActivity } from "@/components/situation-writing-activity";
import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";
import type { SituationSceneId } from "@/lib/curriculum/situation-writing";
import { getDailyPracticePlan, getKoreanDate, getRecentSevenDays, getSelectablePracticeDate } from "@/lib/learning/daily-practice";

type ProgressResponse = {
  today: string;
  completionDates: string[];
  lateCompletionDates: string[];
  streak: number;
  error?: string;
};

function StreakFlame() {
  return (
    <svg className="streak-flame" viewBox="0 0 140 160" role="img" aria-label="연속 학습 불꽃">
      <path className="flame-outer" d="M75 4c8 34-15 41-5 65 9-17 24-22 28-43 27 26 40 53 36 78-5 33-30 53-65 53-39 0-64-24-63-58 1-27 18-49 43-68-2 20 5 30 14 37C60 42 70 28 75 4Z" />
      <path className="flame-inner" d="M69 76c3 18-12 25-9 39 5-8 12-11 17-21 12 11 18 23 16 35-2 15-13 24-28 24-17 0-28-11-28-27 1-13 8-23 19-32 0 10 4 15 8 18-2-13 2-25 5-36Z" />
    </svg>
  );
}

type DailyPracticeTodayProps = {
  requestedDate?: string;
};

export function DailyPracticeToday({ requestedDate }: DailyPracticeTodayProps) {
  const [today, setToday] = useState(getKoreanDate());
  const [practiceDate, setPracticeDate] = useState(() => getSelectablePracticeDate(requestedDate, getKoreanDate()));
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const completingRef = useRef(false);

  const practicePlan = useMemo(() => getDailyPracticePlan(practiceDate), [practiceDate]);
  const recentDays = useMemo(() => getRecentSevenDays(today, completionDates), [today, completionDates]);
  const todayCompleted = completionDates.includes(today);
  const isToday = practiceDate === today;
  const practiceCompleted = completionDates.includes(practiceDate);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      try {
        const response = await fetch("/api/daily-practice", { cache: "no-store" });
        const body = await response.json() as ProgressResponse;
        if (!response.ok) throw new Error(body.error ?? "학습 기록을 불러오지 못했습니다.");
        if (!active) return;
        setToday(body.today);
        setPracticeDate(getSelectablePracticeDate(requestedDate, body.today));
        setCompletionDates(body.completionDates);
        setStreak(body.streak);
      } catch (error) {
        if (active) setProgressError(error instanceof Error ? error.message : "학습 기록을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProgress();
    return () => { active = false; };
  }, [requestedDate]);

  async function completePractice(sessionId: string) {
    if (practiceCompleted || completingRef.current) return;
    completingRef.current = true;
    setProgressError("");
    try {
      const response = await fetch("/api/daily-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, practiceDate })
      });
      const body = await response.json() as ProgressResponse;
      if (!response.ok) throw new Error(body.error ?? "학습 완료 기록을 저장하지 못했습니다.");
      setToday(body.today);
      setCompletionDates(body.completionDates);
      setStreak(body.streak);
      setShowCelebration(isToday);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "학습 완료 기록을 저장하지 못했습니다.");
    } finally {
      completingRef.current = false;
    }
  }

  if (loading) return <div className="daily-roadmap-loading"><MondeukLoading /></div>;

  return (
    <>
      <main className="daily-activity-page">
        <header className="daily-activity-heading">
          <div><span>{isToday ? "오늘의 학습" : "지난 학습 다시 보기"} · {practicePlan.typeLabel}</span><h1>{practicePlan.title}</h1><p>{practicePlan.description}</p></div>
          <strong className={practiceCompleted ? "complete" : isToday ? "active" : "review"}>{isToday ? todayCompleted ? "오늘 완료 ✓" : "오늘의 한 걸음" : practiceCompleted ? "보충 학습 완료 ✓" : "연속 학습 기록 제외"}</strong>
        </header>
        {progressError && <div className="error-panel daily-progress-error" role="alert">{progressError}</div>}
        {practicePlan.type === "concept-learning" ? (
          <ConceptLearningActivity
            key={practicePlan.date}
            onDailyComplete={completePractice}
            questionId={practicePlan.materialId}
          />
        ) : practicePlan.type === "sentence-making" ? (
          <SituationWritingActivity
            dailyMode
            initialSceneId={practicePlan.materialId as SituationSceneId}
            key={practicePlan.date}
            onDailyComplete={completePractice}
          />
        ) : practicePlan.type === "error-correction" ? (
          <ErrorCorrectionActivity
            itemId={practicePlan.materialId}
            key={practicePlan.date}
            onDailyComplete={completePractice}
          />
        ) : (
          <RealLifeChapter
            dailyMode
            initialMaterialId={practicePlan.materialId as RealLifeMaterialKind}
            key={practicePlan.date}
            lessonNumber={6}
            materialGroup={practicePlan.type}
            onDailyComplete={completePractice}
            showOverview={false}
            trackId="grammar"
          />
        )}
      </main>

      {showCelebration && (
        <div className="streak-celebration-backdrop">
          <section aria-labelledby="streak-celebration-title" aria-modal="true" className="streak-celebration" role="dialog">
            <StreakFlame />
            <span>오늘의 문법 루틴 완료!</span>
            <strong>{streak}</strong>
            <h2 id="streak-celebration-title">일 연속 학습</h2>
            <p>오늘도 내 힘으로 문장을 살펴보고 설명했어요.</p>
            <div className="streak-week" aria-label="최근 7일 학습 현황">
              {recentDays.map((day) => (
                <div className={day.completed ? "completed" : day.today ? "today" : ""} key={day.date}>
                  <span>{day.dayLabel.replace("요일", "")}</span>
                  <i>{day.completed ? "✓" : ""}</i>
                </div>
              ))}
            </div>
            <button autoFocus className="streak-continue" onClick={() => setShowCelebration(false)} type="button">계속하기</button>
          </section>
        </div>
      )}
    </>
  );
}
