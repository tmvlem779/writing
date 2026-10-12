update public.prompt_versions
set active = false
where active = true;

insert into public.prompt_versions (version, source_commit, principle_ids, active)
values (
  'writing-tutor-v21',
  'three-question-sequential-real-life-practice',
  array['P1', 'P3', 'P4', 'P6'],
  true
)
on conflict (version) do update
set source_commit = excluded.source_commit,
    principle_ids = excluded.principle_ids,
    active = excluded.active;
