"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { RealLifeChapter } from "@/components/real-life-chapter";
import { SituationWritingActivity } from "@/components/situation-writing-activity";
import type { RealLifeMaterialKind } from "@/lib/curriculum/real-life-materials";
import type { SituationSceneId } from "@/lib/curriculum/situation-writing";
import {
  buildDailyRoadmap,
  getDailyPracticePlan,
  getKoreanDate,
  getRecentSevenDays,
  type DailyPracticePlan
} from "@/lib/learning/daily-practice";

type ProgressResponse = {
  today: string;
  completionDates: string[];
  streak: number;
  todayCompleted: boolean;
  error?: string;
};

const pathOffsets = [0, 1, 2, 1, 0, 1, 2];

function RoadmapIcon({ icon }: { icon: DailyPracticePlan["icon"] }) {
  if (icon === "book") {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c7-2 12 0 16 4v25c-4-4-9-6-16-4V10Zm32 0c-7-2-12 0-16 4v25c4-4 9-6 16-4V10Z" /><path d="M24 14v25" /></svg>;
  }
  if (icon === "news") {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="7" width="32" height="34" rx="5" /><path d="M15 15h10M15 22h18M15 29h18M15 36h12" /></svg>;
  }
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m10 37 4-11L33 7l8 8-19 19-12 3Z" /><path d="m29 11 8 8M14 26l8 8" /></svg>;
}

function StreakFlame() {
  return (
    <svg className="streak-flame" viewBox="0 0 140 160" role="img" aria-label="연속 학습 불꽃">
      <path className="flame-outer" d="M75 4c8 34-15 41-5 65 9-17 24-22 28-43 27 26 40 53 36 78-5 33-30 53-65 53-39 0-64-24-63-58 1-27 18-49 43-68-2 20 5 30 14 37C60 42 70 28 75 4Z" />
      <path className="flame-inner" d="M69 76c3 18-12 25-9 39 5-8 12-11 17-21 12 11 18 23 16 35-2 15-13 24-28 24-17 0-28-11-28-27 1-13 8-23 19-32 0 10 4 15 8 18-2-13 2-25 5-36Z" />
    </svg>
  );
}

export function SelfStudyWorkspace() {
  const [today, setToday] = useState(getKoreanDate());
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const completingRef = useRef(false);
  const activityRef = useRef<HTMLDivElement>(null);

  const todayPlan = useMemo(() => getDailyPracticePlan(today), [today]);
  const roadmap = useMemo(() => buildDailyRoadmap(today, completionDates), [today, completionDates]);
  const recentDays = useMemo(() => getRecentSevenDays(today, completionDates), [today, completionDates]);
  const todayCompleted = completionDates.includes(today);
  const weekCompleted = roadmap.filter((day) => day.status === "completed").length;

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
      <section className="daily-roadmap-shell" aria-labelledby="daily-roadmap-title">
        <header className="daily-roadmap-summary">
          <div>
            <span>매일 한 걸음 · 7일 문법 루틴</span>
            <h2 id="daily-roadmap-title">오늘도 문장을 발견하러 가요</h2>
            <p>문학 작품, 실생활 자료, 문장 만들기를 하루씩 번갈아 연습합니다.</p>
          </div>
          <dl>
            <div><dt>🔥 연속 학습</dt><dd>{streak}일</dd></div>
            <div><dt>✓ 이번 로드맵</dt><dd>{weekCompleted}/7</dd></div>
            <div><dt>오늘 유형</dt><dd>{todayPlan.typeLabel}</dd></div>
          </dl>
        </header>

        <div className="daily-path" aria-label="7일 문법 학습 로드맵">
          {roadmap.map((day, index) => {
            return (
              <div className={`daily-path-step path-index-${index} offset-${pathOffsets[index]} status-${day.status}`} key={day.date}>
                <div className="daily-path-copy">
                  <span>{day.dayLabel} · {day.dateLabel}</span>
                  <strong>{day.title}</strong>
                  <small>{day.status === "completed" ? "완료했어요" : day.status === "today" ? day.description : day.status === "missed" ? "지나간 학습" : "차례가 되면 열려요"}</small>
                </div>
                <button
                  aria-label={`${day.dateLabel} ${day.title} ${day.status === "today" ? "오늘 학습 시작" : day.status === "completed" ? "완료" : "잠김"}`}
                  className="daily-path-node"
                  disabled={day.status !== "today"}
                  onClick={() => activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  type="button"
                >
                  <RoadmapIcon icon={day.icon} />
                  {day.status === "completed" && <span className="daily-check">✓</span>}
                  {day.status === "locked" && <span className="daily-lock">•</span>}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="daily-activity-anchor" ref={activityRef}>
        <header className="daily-activity-heading">
          <div><span>오늘의 학습 · {todayPlan.typeLabel}</span><h2>{todayPlan.title}</h2><p>{todayPlan.description}</p></div>
          <strong className={todayCompleted ? "complete" : "active"}>{todayCompleted ? "오늘 완료 ✓" : "오늘의 한 걸음"}</strong>
        </header>
        {progressError && <div className="error-panel daily-progress-error" role="alert">{progressError}</div>}
        {todayPlan.type === "sentence-making" ? (
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
      </div>

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
