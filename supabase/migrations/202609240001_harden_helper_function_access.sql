-- RLS helper functions need authenticated execution, but they do not need to be
-- exposed as PostgREST RPC endpoints. Keep them in an unexposed schema so they
-- can support policies without revealing membership checks as public RPCs.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

alter function public.is_class_teacher(uuid) set schema private;
alter function public.is_teacher_of(uuid) set schema private;
alter function public.handle_new_user() set schema private;

revoke all on function private.is_class_teacher(uuid) from public, anon, authenticated;
revoke all on function private.is_teacher_of(uuid) from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;

grant execute on function private.is_class_teacher(uuid) to authenticated;
grant execute on function private.is_teacher_of(uuid) to authenticated;
