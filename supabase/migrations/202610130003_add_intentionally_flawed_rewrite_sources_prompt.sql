update public.prompt_versions
set active = false
where active = true;

insert into public.prompt_versions (version, source_commit, principle_ids, active)
values (
  'writing-tutor-v24',
  'intentionally-flawed-authentic-rewrite-sources',
  array['P1', 'P3', 'P4', 'P5', 'P6'],
  true
)
on conflict (version) do update
set source_commit = excluded.source_commit,
    principle_ids = excluded.principle_ids,
    active = excluded.active;
