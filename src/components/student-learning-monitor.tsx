"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentLearningMonitor } from "@/lib/teacher/learning-monitor";

type StudentLearningMonitorProps = {
  classId: string;
  students: StudentLearningMonitor[];
};

type DetailSelection =
  | { kind: "challenge"; studentId: string; lessonNumber: number }
  | { kind: "self-study"; studentId: string; sequence: number }
  | { kind: "wrong-notes"; studentId: string; filter: "all" | "unresolved" | "resolved" };

function formatMonitorTime(value: string | null) {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function StudentLearningMonitor({ classId, students }: StudentLearningMonitorProps) {
  const router = useRouter();
  const [view, setView] = useState<"status" | "analysis">("status");
  const [studentId, setStudentId] = useState(students[0]?.userId ?? "");
  const [detail, setDetail] = useState<DetailSelection | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [router]);

  const effectiveStudentId = students.some((student) => student.userId === studentId) ? studentId : students[0]?.userId;
  const student = useMemo(
    () => students.find((item) => item.userId === effectiveStudentId) ?? students[0],
    [effectiveStudentId, students]
  );
  const detailStudent = detail ? students.find((item) => item.userId === detail.studentId) : null;

  if (!student) return <p className="student-monitor-empty">학생이 학습을 시작하면 진도와 학습 근거가 표시됩니다.</p>;

  const panelId = `student-monitor-panel-${classId}`;

  return (
    <section className="student-live-monitor teacher-learning-dashboard" aria-labelledby={`student-monitor-title-${classId}`}>
      <header className="teacher-learning-dashboard-header">
        <div><span>학급 학습 대시보드</span><h4 id={`student-monitor-title-${classId}`}>학생 활동과 학습 근거</h4></div>
        <div className="teacher-monitor-mode-tabs" role="tablist" aria-label="교사 학습 정보 보기">
          <button aria-selected={view === "status"} className={view === "status" ? "active" : ""} onClick={() => setView("status")} role="tab" type="button">학습 현황</button>
          <button aria-selected={view === "analysis"} className={view === "analysis" ? "active" : ""} onClick={() => setView("analysis")} role="tab" type="button">학습 분석</button>
        </div>
        <p><i aria-hidden="true" />15초마다 새 기록을 확인합니다</p>
      </header>

      {view === "status" ? (
        <div className="teacher-status-view" role="tabpanel">
          <div className="teacher-status-intro">
            <div><span>학습 현황</span><h5>학생별 활동을 한눈에 확인하세요</h5><p>번호 칸을 누르면 완료한 활동과 학습 내용을 자세히 볼 수 있습니다.</p></div>
            <ul aria-label="활동 상태 범례"><li><i className="completed" />완료</li><li><i className="partial" />진행 중</li><li><i />미시작</li></ul>
          </div>
          <div className="teacher-activity-table-wrap">
            <table className="teacher-activity-table">
              <thead><tr><th>학생</th><th>오늘의 챌린지 <small>1~6차시</small></th><th>스스로 유형학습 <small>1~30</small></th><th>오답노트</th></tr></thead>
              <tbody>
                {students.map((item) => {
                  const challengeCompleted = item.challengeActivities.filter((activity) => activity.state === "completed").length;
                  const selfCompleted = item.selfStudyActivities.filter((activity) => activity.state === "completed").length;
                  return (
                    <tr key={item.userId}>
                      <th scope="row"><strong>{item.name}</strong><small>{item.loginId}</small></th>
                      <td>
                        <div className="teacher-activity-cell-heading"><span>{challengeCompleted}/6 완료</span><strong>{percent(challengeCompleted, 6)}%</strong></div>
                        <div className="teacher-challenge-cells">
                          {item.challengeActivities.map((activity) => <button aria-label={`${item.name} 오늘의 챌린지 ${activity.lessonNumber}차시 ${activity.state === "completed" ? "완료" : activity.state === "partial" ? "진행 중" : "미시작"} 상세 보기`} className={activity.state} key={activity.lessonNumber} onClick={() => setDetail({ kind: "challenge", studentId: item.userId, lessonNumber: activity.lessonNumber })} type="button">{activity.state === "completed" ? "✓" : activity.lessonNumber}</button>)}
                        </div>
                      </td>
                      <td>
                        <div className="teacher-activity-cell-heading"><span>{selfCompleted}/30 완료</span><strong>{percent(selfCompleted, 30)}%</strong></div>
                        <div className="teacher-self-study-cells">
                          {item.selfStudyActivities.map((activity) => <button aria-label={`${item.name} 스스로 유형학습 ${activity.sequence}번 ${activity.state === "completed" ? "완료" : "미완료"} 상세 보기`} className={activity.state} key={activity.sequence} onClick={() => setDetail({ kind: "self-study", studentId: item.userId, sequence: activity.sequence })} type="button">{activity.state === "completed" ? "✓" : activity.sequence}</button>)}
                        </div>
                      </td>
                      <td>
                        <div className="teacher-wrong-note-cells">
                          <button onClick={() => setDetail({ kind: "wrong-notes", studentId: item.userId, filter: "all" })} type="button"><span>전체</span><strong>{item.wrongNoteSummary.total}</strong></button>
                          <button className="open" onClick={() => setDetail({ kind: "wrong-notes", studentId: item.userId, filter: "unresolved" })} type="button"><span>다시 볼 문제</span><strong>{item.wrongNoteSummary.unresolved}</strong></button>
                          <button className="resolved" onClick={() => setDetail({ kind: "wrong-notes", studentId: item.userId, filter: "resolved" })} type="button"><span>다시 해결</span><strong>{item.wrongNoteSummary.resolved}</strong></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <section className="teacher-activity-detail" aria-live="polite">
            {!detail || !detailStudent ? (
              <div className="teacher-activity-detail-empty"><strong>활동 번호를 눌러 보세요.</strong><p>학생이 완료했거나 진행 중인 활동의 세부 내용이 여기에 표시됩니다.</p></div>
            ) : detail.kind === "challenge" ? (() => {
              const activity = detailStudent.challengeActivities.find((item) => item.lessonNumber === detail.lessonNumber);
              if (!activity) return null;
              return <><header><div><span>{detailStudent.name} · 오늘의 챌린지</span><h5>{activity.lessonNumber}차시 · {activity.title}</h5></div><strong className={activity.state}>{activity.state === "completed" ? "완료" : activity.state === "partial" ? "진행 중" : "미시작"}</strong></header><dl><div><dt>개념 학습</dt><dd>{activity.conceptCompleted ? "완료" : "미완료"}</dd></div><div><dt>쓰기와 성찰</dt><dd>{activity.completedActivities.length}/{activity.totalActivities}개 활동 완료</dd></div><div><dt>최근 기록</dt><dd>{formatMonitorTime(activity.updatedAt)}</dd></div></dl><div className="teacher-completed-activity-list"><strong>완료한 활동</strong>{activity.completedActivities.length > 0 ? <ul>{activity.completedActivities.map((label) => <li key={label}>{label}</li>)}</ul> : <p>아직 완료한 세부 활동이 없습니다.</p>}</div></>;
            })() : detail.kind === "self-study" ? (() => {
              const activity = detailStudent.selfStudyActivities.find((item) => item.sequence === detail.sequence);
              if (!activity) return null;
              return <><header><div><span>{detailStudent.name} · 스스로 유형학습</span><h5>{activity.sequence}번 활동</h5></div><strong className={activity.state}>{activity.state === "completed" ? "완료" : "미완료"}</strong></header><dl><div><dt>활동 유형</dt><dd>{activity.typeLabel}</dd></div><div><dt>학습 내용</dt><dd>{activity.title}</dd></div><div><dt>완료 기록</dt><dd>{formatMonitorTime(activity.completedAt)}</dd></div></dl></>;
            })() : (() => {
              const answers = detailStudent.wrongAnswers.filter((answer) => detail.filter === "all" || (detail.filter === "resolved" ? Boolean(answer.resolvedAt) : !answer.resolvedAt));
              const title = detail.filter === "all" ? "전체 오답" : detail.filter === "resolved" ? "다시 해결한 문제" : "다시 볼 문제";
              return <><header><div><span>{detailStudent.name} · 오답노트</span><h5>{title}</h5></div><strong>{answers.length}개</strong></header>{answers.length === 0 ? <p className="teacher-evidence-empty">해당하는 오답 기록이 없습니다.</p> : <div className="teacher-wrong-answer-list">{answers.map((answer) => <details key={`${answer.problemTitle}-${answer.updatedAt}`}><summary><span className={answer.resolvedAt ? "resolved" : "open"}>{answer.resolvedAt ? "다시 해결" : "미해결"}</span><div><strong>{answer.problemTitle}</strong><small>{answer.areaLabel} · {answer.attemptCount}회 시도</small></div></summary><dl><div><dt>문항</dt><dd>{answer.question}</dd></div><div><dt>학생 답</dt><dd>{answer.submittedAnswer}</dd></div><div><dt>다시 볼 단서</dt><dd>{answer.feedbackHint}</dd></div></dl></details>)}</div>}</>;
            })()}
          </section>
        </div>
      ) : (
        <div className="teacher-monitor-layout teacher-analysis-view" role="tabpanel">
          <aside className="teacher-student-rail" aria-label="학생 목록">
            <div><strong>학생 목록</strong><span>{students.length}명</span></div>
            <div className="teacher-student-list" role="tablist" aria-orientation="vertical">
              {students.map((item, index) => {
                const needsReview = item.areas.some((area) => area.state === "needs-review");
                return <button aria-controls={panelId} aria-selected={item.userId === student.userId} className={item.userId === student.userId ? "active" : ""} key={item.userId} onClick={() => setStudentId(item.userId)} role="tab" type="button"><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.name}</strong><small>{item.loginId}</small></div>{needsReview && <i aria-label="다시 볼 학습 있음" />}</button>;
              })}
            </div>
          </aside>

          <div className="teacher-student-detail" id={panelId} role="tabpanel">
            <header className="teacher-student-summary"><div><span>선택한 학생</span><h5>{student.name}</h5><small>{student.loginId}</small></div><strong>근거 기반 학습 분석</strong></header>
            <div className="teacher-analysis-summary-grid">
              <article><span>AI 힌트 사용</span><strong>{student.analysis.hintCount}<small>회</small></strong><p>{student.analysis.hintByArea[0] ? `${student.analysis.hintByArea[0].label}에서 가장 많이 사용` : "사용 기록 없음"}</p></article>
              <article><span>누적 오답</span><strong>{student.wrongNoteSummary.total}<small>개</small></strong><p>{student.analysis.wrongByType[0] ? `‘${student.analysis.wrongByType[0].label}’ 유형이 가장 많음` : "오답 기록 없음"}</p></article>
              <article><span>독립 성공</span><strong>{student.analysis.independentSuccesses}<small>/{student.analysis.evidenceCount}</small></strong><p>기록된 학습 근거 중 도움 없이 해결</p></article>
            </div>

            <div className="teacher-analysis-grid">
              <section className="teacher-analysis-panel hint-analysis" aria-labelledby={`hint-analysis-${classId}`}>
                <header><div><span>AI 힌트 분석</span><h5 id={`hint-analysis-${classId}`}>어디에서 도움을 사용했나요?</h5></div><strong>{student.analysis.hintCount}회</strong></header>
                {student.analysis.hintByConcept.length === 0 ? <p className="teacher-evidence-empty">AI 힌트를 사용한 기록이 없습니다.</p> : <div className="teacher-analysis-bars">{student.analysis.hintByConcept.map((item) => <div key={item.label}><span>{item.label}</span><i><b style={{ width: `${percent(item.count, student.analysis.hintCount)}%` }} /></i><strong>{item.count}회</strong></div>)}</div>}
                {student.aiSupport.length > 0 && <ol className="teacher-ai-usage-list">{student.aiSupport.map((usage, index) => <li key={`${usage.createdAt}-${usage.conceptLabel}-${index}`}><span>{usage.areaLabel}</span><div><strong>{usage.conceptLabel}</strong><small>{usage.supportLabel} 사용</small></div><time dateTime={usage.createdAt}>{formatMonitorTime(usage.createdAt)}</time></li>)}</ol>}
              </section>
              <section className="teacher-analysis-panel wrong-analysis" aria-labelledby={`wrong-analysis-${classId}`}>
                <header><div><span>오답 유형 분석</span><h5 id={`wrong-analysis-${classId}`}>어떤 유형에서 많이 틀렸나요?</h5></div><strong>{student.wrongNoteSummary.total}개</strong></header>
                {student.analysis.wrongByType.length === 0 ? <p className="teacher-evidence-empty">분석할 오답 기록이 없습니다.</p> : <div className="teacher-analysis-bars wrong">{student.analysis.wrongByType.map((item) => <div key={item.label}><span>{item.label}</span><i><b style={{ width: `${percent(item.count, student.wrongNoteSummary.total)}%` }} /></i><strong>{item.count}개 · {item.attempts}회 시도</strong></div>)}</div>}
              </section>
            </div>

            <section className="teacher-recommendation-panel" aria-labelledby={`recommendation-title-${classId}`}>
              <header><span>다음 활동 제안</span><h5 id={`recommendation-title-${classId}`}>지금 어떤 활동을 하면 좋을까요?</h5></header>
              <ol>{student.analysis.recommendations.map((item, index) => <li key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.evidence}</p></div></li>)}</ol>
            </section>

            <aside className="student-blocker-diagnosis" aria-label={`${student.name} 학생 학습 정체 진단`}>
              <div><span>근거 기반 진단</span><h5>어떤 지점에서 막히나요?</h5></div>
              <ul>{student.diagnosis.map((item) => <li className={item.level} key={`${item.title}-${item.evidence}`}><i aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.evidence}</p></div></li>)}</ul>
              <small>반복 오답, 독립 성공 비율, 사용한 도움 단계를 종합한 수업 참고 정보입니다.</small>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}
