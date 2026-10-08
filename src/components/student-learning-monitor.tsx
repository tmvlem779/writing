"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentLearningMonitor } from "@/lib/teacher/learning-monitor";

type StudentLearningMonitorProps = {
  classId: string;
  students: StudentLearningMonitor[];
};

function formatMonitorTime(value: string | null) {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function StudentLearningMonitor({ classId, students }: StudentLearningMonitorProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.userId ?? "");

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [router]);

  const effectiveStudentId = students.some((student) => student.userId === studentId) ? studentId : students[0]?.userId;
  const student = useMemo(
    () => students.find((item) => item.userId === effectiveStudentId) ?? students[0],
    [effectiveStudentId, students]
  );

  if (!student) return <p className="student-monitor-empty">학생이 학습을 시작하면 진도와 학습 근거가 표시됩니다.</p>;

  const panelId = `student-monitor-panel-${classId}`;

  return (
    <section className="student-live-monitor" aria-labelledby={`student-monitor-title-${classId}`}>
      <header>
        <div><span>학생별 한눈에 보기</span><h4 id={`student-monitor-title-${classId}`}>학습 진도와 도움 사용 현황</h4></div>
        <p><i aria-hidden="true" />15초마다 새 기록을 확인합니다</p>
      </header>

      <div className="teacher-monitor-layout">
        <aside className="teacher-student-rail" aria-label="학생 목록">
          <div><strong>학생 목록</strong><span>{students.length}명</span></div>
          <div className="teacher-student-list" role="tablist" aria-orientation="vertical">
            {students.map((item, index) => {
              const needsReview = item.areas.some((area) => area.state === "needs-review");
              return (
                <button
                  aria-controls={panelId}
                  aria-selected={item.userId === student.userId}
                  className={item.userId === student.userId ? "active" : ""}
                  key={item.userId}
                  onClick={() => setStudentId(item.userId)}
                  role="tab"
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{item.name}</strong><small>{item.loginId}</small></div>
                  {needsReview && <i aria-label="다시 볼 학습 있음" />}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="teacher-student-detail" id={panelId} role="tabpanel">
          <header className="teacher-student-summary">
            <div><span>선택한 학생</span><h5>{student.name}</h5><small>{student.loginId}</small></div>
            <strong>{student.areas.filter((area) => area.state !== "not-started").length}/3 영역 학습 시작</strong>
          </header>

          <div className="student-overview-grid" aria-label={`${student.name} 학생 영역별 학습 진도`}>
            {student.areas.map((area, index) => (
              <article className={`student-overview-card ${area.id}`} key={area.id}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{area.label}</strong><small>{area.stateLabel}</small></div>
                  <b>{area.progress}%</b>
                </header>
                <div
                  aria-label={`${area.label} 진도 ${area.progress}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={area.progress}
                  className="student-progress-bar"
                  role="progressbar"
                ><i style={{ width: `${area.progress}%` }} /></div>
                <p>{area.progressLabel}</p>
                <dl>{area.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
                <time dateTime={area.lastSeenAt ?? undefined}>최근 기록 · {formatMonitorTime(area.lastSeenAt)}</time>
              </article>
            ))}
          </div>

          <div className="student-evidence-grid">
            <section className="teacher-wrong-answer-panel" aria-labelledby={`wrong-answer-title-${classId}`}>
              <header><div><span>오답 근거</span><h5 id={`wrong-answer-title-${classId}`}>무엇을 틀렸나요?</h5></div><strong>{student.wrongAnswers.length}개</strong></header>
              {student.wrongAnswers.length === 0 ? (
                <p className="teacher-evidence-empty">기록된 오답이 없습니다.</p>
              ) : (
                <div className="teacher-wrong-answer-list">
                  {student.wrongAnswers.map((answer) => (
                    <details key={`${answer.source}-${answer.problemTitle}-${answer.updatedAt}`}>
                      <summary>
                        <span className={answer.resolvedAt ? "resolved" : "open"}>{answer.resolvedAt ? "다시 해결" : "미해결"}</span>
                        <div><strong>{answer.problemTitle}</strong><small>{answer.areaLabel} · {answer.attemptCount}회 시도</small></div>
                      </summary>
                      <dl>
                        <div><dt>문항</dt><dd>{answer.question}</dd></div>
                        <div><dt>학생 답</dt><dd>{answer.submittedAnswer}</dd></div>
                        <div><dt>다시 볼 단서</dt><dd>{answer.feedbackHint}</dd></div>
                      </dl>
                    </details>
                  ))}
                </div>
              )}
            </section>

            <section className="teacher-ai-usage-panel" aria-labelledby={`ai-usage-title-${classId}`}>
              <header><div><span>AI 도움 근거</span><h5 id={`ai-usage-title-${classId}`}>어디에서 도움을 받았나요?</h5></div><strong>{student.aiSupport.length}건</strong></header>
              {student.aiSupport.length === 0 ? (
                <p className="teacher-evidence-empty">AI 도움을 사용한 기록이 없습니다.</p>
              ) : (
                <ol className="teacher-ai-usage-list">
                  {student.aiSupport.map((usage, index) => (
                    <li key={`${usage.createdAt}-${usage.conceptLabel}-${index}`}>
                      <span>{usage.areaLabel}</span>
                      <div><strong>{usage.conceptLabel}</strong><small>{usage.supportLabel} 사용</small></div>
                      <time dateTime={usage.createdAt}>{formatMonitorTime(usage.createdAt)}</time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside className="student-blocker-diagnosis" aria-label={`${student.name} 학생 학습 정체 진단`}>
            <div><span>근거 기반 진단</span><h5>어떤 지점에서 막히나요?</h5></div>
            <ul>
              {student.diagnosis.map((item) => <li className={item.level} key={`${item.title}-${item.evidence}`}>
                <i aria-hidden="true" />
                <div><strong>{item.title}</strong><p>{item.evidence}</p></div>
              </li>)}
            </ul>
            <small>반복 오답, 독립 성공 비율, 사용한 도움 단계를 종합한 수업 참고 정보입니다.</small>
          </aside>
        </div>
      </div>
    </section>
  );
}
