create table public.wrong_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('diagnosis', 'challenge', 'self-study')),
  source_label text not null check (char_length(source_label) between 1 and 40),
  problem_id text not null check (char_length(problem_id) between 1 and 120),
  problem_title text not null check (char_length(problem_title) between 1 and 160),
  question text not null check (char_length(question) between 1 and 1000),
  submitted_answer text not null check (char_length(submitted_answer) between 1 and 1000),
  feedback_hint text not null check (char_length(feedback_hint) between 1 and 500),
  attempt_count integer not null default 1 check (attempt_count between 1 and 100),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, problem_id)
);

create index wrong_answers_user_updated_idx on public.wrong_answers (user_id, updated_at desc);

alter table public.wrong_answers enable row level security;

create policy "wrong_answers_read_owner_or_teacher" on public.wrong_answers
for select to authenticated
using (user_id = auth.uid() or private.is_teacher_of(user_id));

create policy "wrong_answers_insert_owner" on public.wrong_answers
for insert to authenticated
with check (user_id = auth.uid());

create policy "wrong_answers_update_owner" on public.wrong_answers
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "wrong_answers_delete_owner" on public.wrong_answers
for delete to authenticated
using (user_id = auth.uid());
