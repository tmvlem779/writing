-- 로컬 Supabase 테스트 DB에서 실행한다. 모든 변경은 마지막에 롤백한다.
-- 핵심 보장: 무관한 학생은 다른 학생의 기록을 0행만 볼 수 있고,
-- 소유 학생과 같은 학급의 교사는 필요한 학습 기록만 볼 수 있다.

begin;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('handle_new_user', 'is_class_teacher', 'is_teacher_of')
  ) then
    raise exception 'security definer helper remains exposed in public schema';
  end if;
end $$;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher@example.test', '', now(), '{}', '{"role":"teacher","display_alias":"교사"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-a@example.test', '', now(), '{}', '{"role":"student","display_alias":"학생 A"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-b@example.test', '', now(), '{}', '{"role":"student","display_alias":"학생 B"}', now(), now());

insert into public.classes (id, name, teacher_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '테스트 학급', '11111111-1111-1111-1111-111111111111');

insert into public.class_memberships (class_id, user_id, role, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'teacher', 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'student', 'active');

insert into public.learning_sessions (id, user_id, class_id, activity_type)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diagnose');

insert into public.drafts (session_id, user_id, content)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '학생 B 초안');
insert into public.turns (session_id, user_id, actor, content)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'student', '학생 B 발화');
insert into public.concept_states (user_id, concept_code, evidence_count)
values ('33333333-3333-3333-3333-333333333333', 'diagnose', 1);
insert into public.learning_events (session_id, user_id, event_type, concept_code)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'attempt', 'diagnose');
insert into public.wrong_answers (user_id, source, source_label, problem_id, problem_title, question, submitted_answer, feedback_hint)
values ('33333333-3333-3333-3333-333333333333', 'diagnosis', 'AI 진단평가', 'test-question', '테스트 문항', '테스트 질문', '학생 B의 오답', '테스트 단서');
insert into public.challenge_progress (user_id, track_id, lesson_number, concept_completed, completed_activity_ids, last_chapter)
values ('33333333-3333-3333-3333-333333333333', 'grammar', 1, true, array['grammar-components'], 'practice');

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.learning_sessions) <> 0 then raise exception 'student_a can read student_b sessions'; end if;
  if (select count(*) from public.drafts) <> 0 then raise exception 'student_a can read student_b drafts'; end if;
  if (select count(*) from public.turns) <> 0 then raise exception 'student_a can read student_b turns'; end if;
  if (select count(*) from public.concept_states) <> 0 then raise exception 'student_a can read student_b concept state'; end if;
  if (select count(*) from public.learning_events) <> 0 then raise exception 'student_a can read student_b events'; end if;
  if (select count(*) from public.wrong_answers) <> 0 then raise exception 'student_a can read student_b wrong answers'; end if;
  if (select count(*) from public.challenge_progress) <> 0 then raise exception 'student_a can read student_b challenge progress'; end if;
end $$;

do $$
begin
  begin
    insert into public.challenge_progress (user_id, track_id, lesson_number)
    values ('33333333-3333-3333-3333-333333333333', 'grammar', 2);
    raise exception 'student_a inserted student_b challenge progress';
  exception
    when insufficient_privilege then null;
  end;
end $$;

do $$
declare
  affected_rows integer;
begin
  update public.challenge_progress
  set last_chapter = 'concept'
  where user_id = '33333333-3333-3333-3333-333333333333';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then raise exception 'student_a updated student_b challenge progress'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.learning_sessions) <> 1 then raise exception 'owner cannot read own session'; end if;
  if (select count(*) from public.drafts) <> 1 then raise exception 'owner cannot read own draft'; end if;
  if (select count(*) from public.turns) <> 1 then raise exception 'owner cannot read own turn'; end if;
  if (select count(*) from public.concept_states) <> 1 then raise exception 'owner cannot read own concept state'; end if;
  if (select count(*) from public.learning_events) <> 1 then raise exception 'owner cannot read own event'; end if;
  if (select count(*) from public.wrong_answers) <> 1 then raise exception 'owner cannot read own wrong answer'; end if;
  if (select count(*) from public.challenge_progress) <> 1 then raise exception 'owner cannot read own challenge progress'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.learning_sessions) <> 1 then raise exception 'teacher cannot read class session'; end if;
  if (select count(*) from public.drafts) <> 1 then raise exception 'teacher cannot read class draft'; end if;
  if (select count(*) from public.turns) <> 1 then raise exception 'teacher cannot read class turn'; end if;
  if (select count(*) from public.concept_states) <> 1 then raise exception 'teacher cannot read class concept state'; end if;
  if (select count(*) from public.learning_events) <> 1 then raise exception 'teacher cannot read class event'; end if;
  if (select count(*) from public.wrong_answers) <> 1 then raise exception 'teacher cannot read class wrong answer'; end if;
  if (select count(*) from public.challenge_progress) <> 1 then raise exception 'teacher cannot read class challenge progress'; end if;
end $$;

reset role;
rollback;
