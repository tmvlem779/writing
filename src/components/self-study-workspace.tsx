"use client";

import { useEffect, useMemo, useState } from "react";
import { MondeukLoading } from "@/components/mondeuk-loading";
import { buildDailyRoadmap, getDailyPracticePlan, getKoreanDate } from "@/lib/learning/daily-practice";

type ProgressResponse = {
  today: string;
  completionDates: string[];
  streak: number;
  error?: string;
};

const pathOffsets = [0, 1, 2, 1, 0, 1, 2];

function RoadmapIcon({ icon }: { icon: "book" | "news" | "pencil" }) {
  if (icon === "book") {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c7-2 12 0 16 4v25c-4-4-9-6-16-4V10Zm32 0c-7-2-12 0-16 4v25c4-4 9-6 16-4V10Z" /><path d="M24 14v25" /></svg>;
  }
  if (icon === "news") {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="7" width="32" height="34" rx="5" /><path d="M15 15h10M15 22h18M15 29h18M15 36h12" /></svg>;
  }
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m10 37 4-11L33 7l8 8-19 19-12 3Z" /><path d="m29 11 8 8M14 26l8 8" /></svg>;
}

export function SelfStudyWorkspace() {
  const [today, setToday] = useState(getKoreanDate());
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  const todayPlan = useMemo(() => getDailyPracticePlan(today), [today]);
  const roadmap = useMemo(() => buildDailyRoadmap(today, completionDates), [today, completionDates]);
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

  if (loading) return <div className="daily-roadmap-loading"><MondeukLoading /></div>;

  return (
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

      {progressError && <div className="error-panel daily-progress-error" role="alert">{progressError}</div>}

      <div className="daily-path" aria-label="7일 문법 학습 로드맵">
        {roadmap.map((day, index) => {
          const isToday = day.date === today;
          const nodeLabel = `${day.dateLabel} ${day.title} ${isToday ? day.status === "completed" ? "완료한 오늘 학습 다시 열기" : "오늘 학습 시작" : day.status === "completed" ? "완료" : "잠김"}`;
          return (
            <div className={`daily-path-step path-index-${index} offset-${pathOffsets[index]} status-${day.status} ${isToday ? "is-today" : ""}`} key={day.date}>
              <div className="daily-path-copy">
                <span>{day.dayLabel} · {day.dateLabel}</span>
                <strong>{day.title}</strong>
                <small>{day.status === "completed" ? isToday ? "완료했어요 · 다시 학습할 수 있어요" : "완료했어요" : day.status === "today" ? `${day.description} 눌러서 시작해요.` : day.status === "missed" ? "지나간 학습" : "차례가 되면 열려요"}</small>
              </div>
              {isToday ? (
                <a
                  aria-label={nodeLabel}
                  className="daily-path-node"
                  href="/learn/self-study/today"
                >
                  <RoadmapIcon icon={day.icon} />
                  {day.status === "completed" && <span className="daily-check">✓</span>}
                </a>
              ) : (
                <button aria-label={nodeLabel} className="daily-path-node" disabled type="button">
                  <RoadmapIcon icon={day.icon} />
                  {day.status === "completed" && <span className="daily-check">✓</span>}
                  {day.status === "locked" && <span className="daily-lock">•</span>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
