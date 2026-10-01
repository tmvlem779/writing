import Link from "next/link";
import { StudentLearningNav } from "@/components/student-learning-nav";
import { getStudentSession } from "@/lib/auth/student-session";

type WrongAnswerRow = {
  id: string;
  source: "diagnosis" | "challenge" | "self-study";
  source_label: string;
  problem_id: string;
  problem_title: string;
  question: string;
  submitted_answer: string;
  feedback_hint: string;
  attempt_count: number;
  resolved_at: string | null;
  updated_at: string;
};

const sourceLinks = {
  diagnosis: "/learn/diagnosis",
  challenge: "/learn/challenge",
  "self-study": "/learn/self-study"
} as const;

export default async function WrongNotesPage() {
  const { supabase, user } = await getStudentSession();
  let notes: WrongAnswerRow[] = [];
  if (supabase && user) {
    const { data } = await supabase
      .from("wrong_answers")
      .select("id,source,source_label,problem_id,problem_title,question,submitted_answer,feedback_hint,attempt_count,resolved_at,updated_at")
      .eq("user_id", user.id)
      .order("resolved_at", { ascending: true, nullsFirst: true })
      .order("updated_at", { ascending: false });
    notes = (data ?? []) as WrongAnswerRow[];
  }

  const unresolved = notes.filter((note) => !note.resolved_at).length;

  return (
    <section className="student-activity-page">
      <StudentLearningNav active="wrong-notes" />
      <main className="wrong-notes-page">
        <header>
          <div><span>오답노트</span><h1>틀린 지점을 다시 질문으로 바꿔요</h1><p>정답을 외우기보다 어느 영역에서 무엇을 놓쳤는지 확인하고 다시 설명해 보세요.</p></div>
          <strong>{unresolved}<small>다시 볼 문제</small></strong>
        </header>

        {notes.length === 0 ? (
          <section className="wrong-notes-empty">
            <span aria-hidden="true">✓</span>
            <h2>아직 기록된 오답이 없어요</h2>
            <p>오늘의 챌린지나 스스로 유형 학습에서 다시 살펴볼 문제가 생기면 이곳에 모입니다.</p>
            <Link className="primary-button" href="/learn/challenge">오늘의 챌린지 시작하기</Link>
          </section>
        ) : (
          <div className="wrong-note-list">
            {notes.map((note) => (
              <article className={note.resolved_at ? "wrong-note-card resolved" : "wrong-note-card"} key={note.id}>
                <div className="wrong-note-meta">
                  <span>{note.source_label}</span>
                  <small>{note.problem_title}</small>
                  <i>{note.resolved_at ? "다시 해결함" : `${note.attempt_count}회 오답`}</i>
                </div>
                <h2>{note.question}</h2>
                <dl>
                  <div><dt>내가 고른 답</dt><dd>{note.submitted_answer}</dd></div>
                  <div><dt>다시 볼 단서</dt><dd>{note.feedback_hint}</dd></div>
                </dl>
                <footer>
                  <time dateTime={note.updated_at}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(note.updated_at))}</time>
                  <Link href={sourceLinks[note.source]}>이 영역 다시 학습하기 →</Link>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>
    </section>
  );
}
