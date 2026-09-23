create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_alias text not null default '학생',
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references auth.users(id) on delete restrict,
  invite_code_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_memberships (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'teacher')),
  status text not null default 'active' check (status in ('invited', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  activity_type text not null check (activity_type in ('diagnose', 'create', 'expand', 'compare', 'error', 'transfer', 'reflect')),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.drafts(id) on delete set null,
  content text not null,
  revision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor text not null check (actor in ('student', 'assistant', 'teacher')),
  content text not null,
  response_json jsonb,
  prompt_version text,
  created_at timestamptz not null default now()
);

create table public.concept_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_code text not null,
  scaffold_level smallint not null default 0 check (scaffold_level between 0 and 4),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  independent_success_count integer not null default 0 check (independent_success_count >= 0),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_code)
);

create table public.learning_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  concept_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.safety_events (
  id bigint generated always as identity primary key,
  session_id uuid references public.learning_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  action text not null,
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create table public.api_usage (
  id bigint generated always as identity primary key,
  session_id uuid references public.learning_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_estimate_usd numeric(12, 8) not null default 0,
  latency_ms integer,
  status text not null,
  created_at timestamptz not null default now()
);

create table public.prompt_versions (
  version text primary key,
  source_commit text,
  principle_ids text[] not null default '{}',
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create index learning_sessions_user_idx on public.learning_sessions(user_id, created_at desc);
create index turns_session_idx on public.turns(session_id, created_at);
create index drafts_session_idx on public.drafts(session_id, created_at);
create index api_usage_month_idx on public.api_usage(created_at, cost_estimate_usd);
create index memberships_user_idx on public.class_memberships(user_id, class_id);

create or replace function public.is_class_teacher(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_memberships
    where class_id = target_class_id
      and user_id = auth.uid()
      and role = 'teacher'
      and status = 'active'
  );
$$;

create or replace function public.is_teacher_of(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships teacher_membership
    join public.class_memberships student_membership
      on teacher_membership.class_id = student_membership.class_id
    where teacher_membership.user_id = auth.uid()
      and teacher_membership.role = 'teacher'
      and teacher_membership.status = 'active'
      and student_membership.user_id = target_student_id
      and student_membership.role = 'student'
      and student_membership.status in ('invited', 'active')
  );
$$;

revoke all on function public.is_class_teacher(uuid) from public;
revoke all on function public.is_teacher_of(uuid) from public;
grant execute on function public.is_class_teacher(uuid) to authenticated;
grant execute on function public.is_teacher_of(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.drafts enable row level security;
alter table public.turns enable row level security;
alter table public.concept_states enable row level security;
alter table public.learning_events enable row level security;
alter table public.safety_events enable row level security;
alter table public.api_usage enable row level security;
alter table public.prompt_versions enable row level security;

create policy "profiles_read_own_or_teacher" on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_teacher_of(user_id));
create policy "profiles_update_own" on public.profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "classes_read_members" on public.classes for select to authenticated
using (exists (select 1 from public.class_memberships m where m.class_id = id and m.user_id = auth.uid()));
create policy "classes_insert_teacher" on public.classes for insert to authenticated
with check (teacher_id = auth.uid() and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'teacher'));
create policy "classes_update_teacher" on public.classes for update to authenticated
using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "memberships_read_own_or_teacher" on public.class_memberships for select to authenticated
using (user_id = auth.uid() or public.is_class_teacher(class_id));
create policy "memberships_write_teacher" on public.class_memberships for all to authenticated
using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));

create policy "sessions_read_owner_or_teacher" on public.learning_sessions for select to authenticated
using (user_id = auth.uid() or public.is_teacher_of(user_id));
create policy "sessions_insert_owner" on public.learning_sessions for insert to authenticated
with check (user_id = auth.uid());
create policy "sessions_update_owner" on public.learning_sessions for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sessions_delete_owner" on public.learning_sessions for delete to authenticated
using (user_id = auth.uid());

create policy "drafts_read_owner_or_teacher" on public.drafts for select to authenticated
using (user_id = auth.uid() or public.is_teacher_of(user_id));
create policy "drafts_insert_owner" on public.drafts for insert to authenticated
with check (user_id = auth.uid());
create policy "drafts_update_owner" on public.drafts for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "drafts_delete_owner" on public.drafts for delete to authenticated
using (user_id = auth.uid());

create policy "turns_read_owner_or_teacher" on public.turns for select to authenticated
using (user_id = auth.uid() or public.is_teacher_of(user_id));
create policy "turns_insert_owner" on public.turns for insert to authenticated
with check (user_id = auth.uid());

create policy "concepts_read_owner_or_teacher" on public.concept_states for select to authenticated
using (user_id = auth.uid() or public.is_teacher_of(user_id));
create policy "concepts_write_owner" on public.concept_states for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "events_read_owner_or_teacher" on public.learning_events for select to authenticated
using (user_id = auth.uid() or public.is_teacher_of(user_id));
create policy "events_insert_owner" on public.learning_events for insert to authenticated
with check (user_id = auth.uid());

create policy "usage_read_own" on public.api_usage for select to authenticated using (user_id = auth.uid());
create policy "prompts_read_active" on public.prompt_versions for select to authenticated using (active = true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  requested_class uuid;
begin
  requested_role := case when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher' else 'student' end;
  insert into public.profiles (user_id, display_alias, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_alias', requested_role), requested_role)
  on conflict (user_id) do nothing;

  if new.raw_user_meta_data ? 'class_id' then
    requested_class := (new.raw_user_meta_data ->> 'class_id')::uuid;
    insert into public.class_memberships (class_id, user_id, role, status)
    values (requested_class, new.id, requested_role, 'invited')
    on conflict (class_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.prompt_versions (version, principle_ids, active)
values ('writing-tutor-v1', array['P1','P2','P3','P4','P5','P6'], true)
on conflict (version) do update set active = excluded.active;
