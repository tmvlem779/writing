alter table public.learning_sessions
  drop constraint if exists learning_sessions_activity_type_check;

alter table public.learning_sessions
  add constraint learning_sessions_activity_type_check
  check (activity_type in ('diagnose', 'create', 'expand', 'compare', 'error', 'transfer', 'reflect', 'authentic'));

update public.prompt_versions
set active = false
where active = true;

insert into public.prompt_versions (version, principle_ids, active)
values ('writing-tutor-v2', array['P1','P2','P3','P4','P5','P6'], true)
on conflict (version) do update
set principle_ids = excluded.principle_ids,
    active = excluded.active;
