create or replace function public.record_learning_turn(
  target_user_id uuid,
  target_session_id uuid,
  target_activity text,
  student_content text,
  assistant_content text,
  assistant_response jsonb,
  target_prompt_version text,
  target_model text,
  target_input_tokens integer,
  target_output_tokens integer,
  target_cost_estimate_usd numeric,
  target_latency_ms integer,
  target_concept_code text,
  target_scaffold_level smallint,
  target_event_type text,
  target_independent_success boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.learning_sessions
    where id = target_session_id and user_id = target_user_id
  ) then
    raise exception 'session_not_owned';
  end if;

  insert into public.turns (session_id, user_id, actor, content, prompt_version)
  values (target_session_id, target_user_id, 'student', student_content, target_prompt_version);

  insert into public.turns (session_id, user_id, actor, content, response_json, prompt_version)
  values (target_session_id, target_user_id, 'assistant', assistant_content, assistant_response, target_prompt_version);

  insert into public.drafts (session_id, user_id, content, revision_reason)
  values (target_session_id, target_user_id, student_content, 'AI 피드백 전 제출');

  insert into public.learning_events (session_id, user_id, event_type, concept_code, metadata)
  values (
    target_session_id,
    target_user_id,
    target_event_type,
    target_concept_code,
    jsonb_build_object(
      'activity', target_activity,
      'scaffold_level', target_scaffold_level,
      'prompt_version', target_prompt_version
    )
  );

  insert into public.concept_states (
    user_id,
    concept_code,
    scaffold_level,
    evidence_count,
    independent_success_count,
    last_seen_at,
    updated_at
  )
  values (
    target_user_id,
    target_concept_code,
    target_scaffold_level,
    1,
    case when target_independent_success then 1 else 0 end,
    now(),
    now()
  )
  on conflict (user_id, concept_code) do update
  set scaffold_level = excluded.scaffold_level,
      evidence_count = public.concept_states.evidence_count + 1,
      independent_success_count = public.concept_states.independent_success_count
        + case when target_independent_success then 1 else 0 end,
      last_seen_at = now(),
      updated_at = now();

  insert into public.api_usage (
    user_id,
    session_id,
    model,
    input_tokens,
    output_tokens,
    cost_estimate_usd,
    latency_ms,
    status
  )
  values (
    target_user_id,
    target_session_id,
    target_model,
    target_input_tokens,
    target_output_tokens,
    target_cost_estimate_usd,
    target_latency_ms,
    'ok'
  );

  update public.learning_sessions
  set activity_type = target_activity,
      updated_at = now()
  where id = target_session_id and user_id = target_user_id;
end;
$$;

revoke all on function public.record_learning_turn(
  uuid, uuid, text, text, text, jsonb, text, text, integer, integer,
  numeric, integer, text, smallint, text, boolean
) from public, anon, authenticated;

grant execute on function public.record_learning_turn(
  uuid, uuid, text, text, text, jsonb, text, text, integer, integer,
  numeric, integer, text, smallint, text, boolean
) to service_role;
