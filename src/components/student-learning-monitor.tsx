"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LearningArea, StudentLearningMonitor } from "@/lib/teacher/learning-monitor";

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
  const [areaId, setAreaId] = useState<LearningArea>("challenge");

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [router]);

  const effectiveStudentId = students.some((student) => student.userId === studentId) ? studentId : students[0]?.userId;
  const student = useMemo(
    () => students.find((item) => item.userId === effectiveStudentId) ?? students[0],
    [effectiveStudentId, students]
  );
  const area = student?.areas.find((item) => item.id === areaId) ?? student?.areas[0];

  if (!student || !area) return <p className="student-monitor-empty">학생이 학습을 시작하면 실시간 현황과 진단이 표시됩니다.</p>;

  const studentTabsId = `student-monitor-tabs-${classId}`;
  const areaTabsId = `student-area-tabs-${classId}`;

  return (
    <section className="student-live-monitor" aria-labelledby={`student-monitor-title-${classId}`}>
      <header>
        <div><span>자동 갱신</span><h4 id={`student-monitor-title-${classId}`}>학생별 실시간 학습 현황</h4></div>
        <p><i aria-hidden="true" />15초마다 새 기록을 확인합니다</p>
      </header>

      <div aria-label="학생 선택" className="student-monitor-tabs" id={studentTabsId} role="tablist">
        {students.map((item) => (
          <button
            aria-controls={`student-monitor-panel-${classId}`}
            aria-selected={item.userId === student.userId}
            className={item.userId === student.userId ? "active" : ""}
            key={item.userId}
            onClick={() => setStudentId(item.userId)}
            role="tab"
            type="button"
          >
            <strong>{item.name}</strong>
            <small>{item.loginId}</small>
          </button>
        ))}
      </div>

      <div className="student-monitor-panel" id={`student-monitor-panel-${classId}`} role="tabpanel">
        <div aria-label="학습 영역 선택" className="student-area-tabs" id={areaTabsId} role="tablist">
          {student.areas.map((item, index) => (
            <button
              aria-controls={`student-area-panel-${classId}`}
              aria-selected={item.id === area.id}
              className={item.id === area.id ? "active" : ""}
              key={item.id}
              onClick={() => setAreaId(item.id)}
              role="tab"
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <small className={item.state}>{item.stateLabel}</small>
            </button>
          ))}
        </div>

        <div className="student-area-panel" id={`student-area-panel-${classId}`} role="tabpanel">
          <div className="student-area-summary">
            <div><span>{area.label}</span><strong className={area.state}>{area.stateLabel}</strong></div>
            <time dateTime={area.lastSeenAt ?? undefined}>최근 기록 · {formatMonitorTime(area.lastSeenAt)}</time>
            <dl>
              {area.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}
            </dl>
            <p>{area.detail}</p>
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
