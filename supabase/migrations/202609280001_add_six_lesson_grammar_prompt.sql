update public.prompt_versions
set active = false
where active = true;

insert into public.prompt_versions (version, change_reason, principles, active)
values (
  'writing-tutor-v6',
  'six-lesson-grammar-course',
  array[
    'B안 4차시를 종결·높임·시간 표현으로 구성',
    'B안 5차시를 피동·사동·부정·인용 표현으로 구성',
    '기존 종합 활동과 날개 실생활 탐구를 B안 6차시에 통합'
  ],
  true
);
