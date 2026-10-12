import Link from "next/link";
import { StudentLearningNav } from "@/components/student-learning-nav";
import { WrongNoteReviewList } from "@/components/wrong-note-review-list";
import { getStudentSession } from "@/lib/auth/student-session";
import { buildWrongNotePractice, toPublicWrongNotePractice } from "@/lib/learning/wrong-note-practice";

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
          <WrongNoteReviewList notes={notes.map((note) => {
            const practice = buildWrongNotePractice({
              id: note.id,
              source: note.source,
              problemId: note.problem_id,
              problemTitle: note.problem_title,
              question: note.question,
              submittedAnswer: note.submitted_answer,
              feedbackHint: note.feedback_hint
            });
            return {
              id: note.id,
              source: note.source,
              sourceLabel: note.source_label,
              problemTitle: note.problem_title,
              question: note.question,
              submittedAnswer: note.submitted_answer,
              feedbackHint: note.feedback_hint,
              attemptCount: note.attempt_count,
              resolvedAt: note.resolved_at,
              updatedAt: note.updated_at,
              practice: practice ? toPublicWrongNotePractice(practice) : null
            };
          })} />
        )}
      </main>
    </section>
  );
}
