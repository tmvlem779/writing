"use client";

import { useMemo, useState } from "react";
import type { Activity, AgentResponse } from "@/lib/agent/schema";
import { scaffoldLabel } from "@/lib/agent/state-machine";

const activities: Array<{ value: Activity; label: string; prompt: string }> = [
  { value: "diagnose", label: "시작 진단", prompt: "주어와 서술어가 잘 호응하는 문장을 한 문장 써 보세요." },
  { value: "create", label: "문장 만들기", prompt: "‘학생’과 ‘도서관’을 활용해 기본 문장을 만들어 보세요." },
  { value: "expand", label: "문장 확장", prompt: "기본 문장에 수식어나 절을 더해 뜻을 구체화해 보세요." },
  { value: "compare", label: "구조 비교", prompt: "같은 내용을 이어진문장과 안은문장으로 표현해 보세요." },
  { value: "error", label: "오류 탐구", prompt: "어색한 문장을 고치기 전에 문제가 있는 부분과 이유를 설명해 보세요." },
  { value: "transfer", label: "짧은 글쓰기", prompt: "배운 문장 구조를 활용해 학교생활에 관한 짧은 글을 써 보세요." },
  { value: "reflect", label: "성찰", prompt: "처음 문장과 지금 문장에서 달라진 점을 설명해 보세요." }
];

type Message = { role: "student" | "assistant"; content: string };

export function PracticeChapter() {
  const [activity, setActivity] = useState<Activity>("diagnose");
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [scaffoldLevel, setScaffoldLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  const selected = useMemo(() => activities.find((item) => item.value === activity) ?? activities[0], [activity]);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const result = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity })
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error ?? "세션을 시작할 수 없습니다.");
    setSessionId(body.id);
    setDemo(Boolean(body.demo));
    return body.id as string;
  }

  async function submit() {
    if (!draft.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      const id = await ensureSession();
      const result = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          activity,
          message: draft,
          scaffoldLevel,
          attemptCount,
          history: history.slice(-6)
        })
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "응답을 불러오지 못했습니다.");
      const next = body as AgentResponse & { demo?: boolean };
      setResponse(next);
      setDemo((current) => current || Boolean(next.demo));
      setScaffoldLevel(next.scaffoldLevel);
      setAttemptCount((count) => count + 1);
      setHistory((items) => [
        ...items,
        { role: "student", content: draft },
        { role: "assistant", content: `${next.studentMessage} ${next.question}` }
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 생겼습니다.");
    } finally {
      setPending(false);
    }
  }

  function changeActivity(next: Activity) {
    setActivity(next);
    setResponse(null);
    setAttemptCount(0);
    setScaffoldLevel(0);
    setDraft("");
  }

  return (
    <div className="studio-shell">
      <aside className="activity-sidebar" aria-label="2장 학습 활동">
        <div className="sidebar-heading">
          <span>Chapter 02</span>
          <strong>문장 쓰기와 성찰</strong>
        </div>
        {activities.map((item, index) => (
          <button
            className={activity === item.value ? "activity-button active" : "activity-button"}
            key={item.value}
            onClick={() => changeActivity(item.value)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </button>
        ))}
        <div className="scaffold-meter">
          <span>현재 도움 단계</span>
          <strong>{scaffoldLabel(scaffoldLevel)}</strong>
          <div className="meter-track" aria-label={`도움 단계 ${scaffoldLevel + 1}/5`}>
            <i style={{ width: `${((scaffoldLevel + 1) / 5) * 100}%` }} />
          </div>
        </div>
      </aside>

      <section className="workspace" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">{selected.label}</span>
            <h1 id="workspace-title">생각을 먼저 적어 보세요</h1>
          </div>
          {demo && <span className="demo-badge">개발용 데모</span>}
        </header>

        <div className="task-card">
          <span>이번 과제</span>
          <p>{selected.prompt}</p>
        </div>

        <label className="draft-label" htmlFor="student-draft">내 문장과 생각</label>
        <textarea
          id="student-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="완벽하게 쓰려고 하지 않아도 괜찮아요. 먼저 생각나는 문장을 적어 보세요."
          maxLength={4000}
        />
        <div className="editor-footer">
          <span>{draft.length.toLocaleString()} / 4,000자</span>
          <button className="primary-button" onClick={submit} disabled={pending || !draft.trim()} type="button">
            {pending ? "생각을 살펴보는 중…" : "질문과 힌트 받기"}
          </button>
        </div>

        {error && <div className="error-panel" role="alert">{error}</div>}

        {response && (
          <article className="coach-card" aria-live="polite">
            <div className="coach-label"><span>AI 학습 도우미</span><small>{scaffoldLabel(response.scaffoldLevel)}</small></div>
            <p>{response.studentMessage}</p>
            <div className="coach-question">
              <span>다음 생각</span>
              <strong>{response.question}</strong>
            </div>
            {response.focusConcepts.length > 0 && (
              <div className="concept-tags" aria-label="학습 초점">
                {response.focusConcepts.map((concept) => <span key={concept}>{concept}</span>)}
              </div>
            )}
          </article>
        )}
      </section>

      <aside className="evidence-panel" aria-label="학습 기록">
        <span className="panel-kicker">학습 기록</span>
        <h2>내가 해낸 과정</h2>
        <dl>
          <div><dt>시도 횟수</dt><dd>{attemptCount}</dd></div>
          <div><dt>현재 도움</dt><dd>{scaffoldLevel + 1}/5</dd></div>
          <div><dt>대화 기록</dt><dd>{Math.floor(history.length / 2)}</dd></div>
        </dl>
        <p>독립적으로 해결한 부분과 도움을 받은 부분을 구분해 다음 활동의 난이도를 조절합니다.</p>
      </aside>
    </div>
  );
}
