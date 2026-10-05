"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConceptLearningActivity } from "@/components/concept-learning-activity";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { RealLifeChapter } from "@/components/real-life-chapter";
import { SituationWritingActivity } from "@/components/situation-writing-activity";
import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";
import type { SituationSceneId } from "@/lib/curriculum/situation-writing";
import { getDailyPracticePlan, getKoreanDate, getRecentSevenDays } from "@/lib/learning/daily-practice";

type ProgressResponse = {
  today: string;
  completionDates: string[];
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

export function DailyPracticeToday() {
  const [today, setToday] = useState(getKoreanDate());
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const completingRef = useRef(false);

  const todayPlan = useMemo(() => getDailyPracticePlan(today), [today]);
  const recentDays = useMemo(() => getRecentSevenDays(today, completionDates), [today, completionDates]);
  const todayCompleted = completionDates.includes(today);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      try {
        const response = await fetch("/api/daily-practice", { cache: "no-store" });
        const body = await response.json() as ProgressResponse;
        if (!response.ok) throw new Error(body.error ?? "학습 기록을 불러오지 못했습니다.");
        if (!active) return;
        setToday(body.today);
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
  }, []);

  async function completeToday(sessionId: string) {
    if (todayCompleted || completingRef.current) return;
    completingRef.current = true;
    setProgressError("");
    try {
      const response = await fetch("/api/daily-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const body = await response.json() as ProgressResponse;
      if (!response.ok) throw new Error(body.error ?? "오늘의 완료 기록을 저장하지 못했습니다.");
      setToday(body.today);
      setCompletionDates(body.completionDates);
      setStreak(body.streak);
      setShowCelebration(true);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "오늘의 완료 기록을 저장하지 못했습니다.");
    } finally {
      completingRef.current = false;
    }
  }

  if (loading) return <div className="daily-roadmap-loading"><MondeukLoading /></div>;

  return (
    <>
      <main className="daily-activity-page">
        <header className="daily-activity-heading">
          <div><span>오늘의 학습 · {todayPlan.typeLabel}</span><h1>{todayPlan.title}</h1><p>{todayPlan.description}</p></div>
          <strong className={todayCompleted ? "complete" : "active"}>{todayCompleted ? "오늘 완료 ✓" : "오늘의 한 걸음"}</strong>
        </header>
        {progressError && <div className="error-panel daily-progress-error" role="alert">{progressError}</div>}
        {todayPlan.type === "concept-learning" ? (
          <ConceptLearningActivity
            key={todayPlan.date}
            onDailyComplete={completeToday}
            questionId={todayPlan.materialId}
          />
        ) : todayPlan.type === "sentence-making" ? (
          <SituationWritingActivity
            dailyMode
            initialSceneId={todayPlan.materialId as SituationSceneId}
            key={todayPlan.date}
            onDailyComplete={completeToday}
          />
        ) : (
          <RealLifeChapter
            dailyMode
            initialMaterialId={todayPlan.materialId as RealLifeMaterialKind}
            key={todayPlan.date}
            lessonNumber={6}
            materialGroup={todayPlan.type}
            onDailyComplete={completeToday}
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
