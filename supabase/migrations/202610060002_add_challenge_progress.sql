create table public.challenge_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('structure', 'grammar')),
  lesson_number smallint not null check (lesson_number between 1 and 6),
  concept_completed boolean not null default false,
  completed_activity_ids text[] not null default '{}',
  last_chapter text not null default 'concept' check (last_chapter in ('concept', 'practice', 'real-life')),
  last_activity_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id, lesson_number),
  check (cardinality(completed_activity_ids) <= 12),
  check (last_activity_id is null or char_length(last_activity_id) <= 100)
);

create index challenge_progress_updated_idx on public.challenge_progress(user_id, updated_at desc);

alter table public.challenge_progress enable row level security;

create policy "challenge_progress_read_owner_or_teacher"
on public.challenge_progress for select to authenticated
using (user_id = auth.uid() or private.is_teacher_of(user_id));

create policy "challenge_progress_insert_owner"
on public.challenge_progress for insert to authenticated
with check (user_id = auth.uid());

create policy "challenge_progress_update_owner"
on public.challenge_progress for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "challenge_progress_delete_owner"
on public.challenge_progress for delete to authenticated
using (user_id = auth.uid());
