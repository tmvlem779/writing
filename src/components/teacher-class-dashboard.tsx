"use client";

import { useMemo, useState } from "react";
import { ClassCreateForm } from "@/components/class-create-form";
import { InviteForm } from "@/components/invite-form";
import { StudentLearningMonitor } from "@/components/student-learning-monitor";
import type { StudentLearningMonitor as StudentLearningMonitorData } from "@/lib/teacher/learning-monitor";

export type TeacherClassView = {
  id: string;
  name: string;
  students: Array<{
    userId: string;
    alias: string;
    loginId: string;
    status: "invited" | "active";
    createdAt: string;
  }>;
  monitors: StudentLearningMonitorData[];
};

function formatRegistrationDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export function TeacherClassDashboard({ classes, canCreate }: { classes: TeacherClassView[]; canCreate: boolean }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? classes[0],
    [classes, selectedClassId]
  );

  return (
    <section className="teacher-section teacher-class-dashboard">
      <div className="section-title-row teacher-class-heading">
        <div><span>내 학급</span><h2>학급별 학생 진도 현황</h2></div>
        <div className="teacher-class-actions">
          <p><strong>{classes.length}</strong><span>개 학급</span></p>
          {canCreate && <ClassCreateForm onCreated={setSelectedClassId} />}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state"><strong>표시할 학급이 없습니다.</strong><p>학급 등록 버튼을 눌러 첫 학급을 만들어 보세요.</p></div>
      ) : (
        <>
          <nav className="teacher-class-tabs" aria-label="학급 선택" role="tablist">
            {classes.map((item, index) => (
              <button
                aria-controls={`teacher-class-panel-${item.id}`}
                aria-selected={item.id === selectedClass?.id}
                className={item.id === selectedClass?.id ? "active" : ""}
                key={item.id}
                onClick={() => setSelectedClassId(item.id)}
                role="tab"
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.name}</strong>
                <small>학생 {item.students.length}명</small>
              </button>
            ))}
          </nav>

          {selectedClass && (
            <article
              aria-labelledby={`teacher-class-title-${selectedClass.id}`}
              className="class-card teacher-class-panel"
              id={`teacher-class-panel-${selectedClass.id}`}
              role="tabpanel"
            >
              <header className="teacher-class-panel-heading">
                <div><span>선택한 학급</span><h3 id={`teacher-class-title-${selectedClass.id}`}>{selectedClass.name}</h3></div>
                <strong>학생 {selectedClass.students.length}명</strong>
              </header>

              <section className="student-account-section" aria-labelledby={`student-accounts-${selectedClass.id}`}>
                <div className="student-account-heading">
                  <div><span>계정 관리</span><h4 id={`student-accounts-${selectedClass.id}`}>학생 계정 목록</h4></div>
                  <strong>{selectedClass.students.length}명</strong>
                </div>
                {selectedClass.students.length === 0 ? <p className="student-account-empty">아직 만든 학생 계정이 없습니다.</p> : <ol className="student-account-list">
                  {selectedClass.students.map((student, index) => <li key={student.userId}>
                    <span className="student-account-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{student.alias}</strong><small>{student.loginId}</small></div>
                    <span className={`student-account-status ${student.status}`}>{student.status === "active" ? "사용 중" : "초대 중"}</span>
                    <time dateTime={student.createdAt}>{formatRegistrationDate(student.createdAt)} 등록</time>
                  </li>)}
                </ol>}
              </section>

              <StudentLearningMonitor key={selectedClass.id} classId={selectedClass.id} students={selectedClass.monitors} />
              <InviteForm classId={selectedClass.id} />
            </article>
          )}
        </>
      )}
    </section>
  );
}
