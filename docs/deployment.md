# 배포 체크리스트

## 0. 현재 운영 상태 (2026-09-24)

- GitHub: `https://github.com/tmvlem779/writing`, `main` 푸시 완료
- Supabase: 서울 리전 `writing-agent` 프로젝트에 migration 3개 적용, 원격 RLS 테스트 통과, 보안 권고 0건
- Vercel: `https://writing-suhyeon3.vercel.app`에 Production 배포 완료
- Vercel 환경 변수: Supabase, OpenAI, 안전 식별자, 인증·예산 설정 등록 완료
- Vercel 공개 접근: Vercel Authentication 해제, 외부 비로그인 요청 200 확인
- GitHub 자동 배포: Vercel GitHub App을 `tmvlem779/writing` 저장소 하나에만 허용하고 프로젝트 연결 완료
- 운영 UI: 홈·로그인·학습·개인정보 화면 렌더링, 390px 모바일 화면, 비로그인 AI 요청 401 처리 확인
- 보류: OpenAI 결제 크레딧·프로젝트 한도, 초기 교사·학급, 인증된 전체 E2E

비밀값은 이 문서와 저장소에 기록하지 않는다. 실제 키는 Vercel의 암호화된 Production 환경 변수에만 둔다.

## 1. Supabase

1. 개발용과 운영용 프로젝트를 분리한다.
2. SQL Editor 또는 Supabase CLI로 `supabase/migrations`의 파일을 번호순으로 적용한다.
3. `supabase/tests/rls.sql`을 별도 테스트 프로젝트에서 실행해 교차 사용자 접근이 실패하는지 확인한다.
4. Auth의 공개 회원가입을 끄고, Site URL과 Redirect URL에 Vercel 주소 및 `/auth/confirm` 경로를 등록한다.
   - 로컬: `http://localhost:3000/auth/confirm`
   - Preview: `https://*-<team>.vercel.app/auth/confirm`
   - Production: `https://<production-domain>/auth/confirm`
5. 운영 서비스 역할 키는 Vercel 서버 환경 변수에만 둔다.

## 2. OpenAI

1. 프로젝트 전용 API 키와 월 사용량 알림을 만든다.
2. 앱 내부 한도 `MONTHLY_OPENAI_BUDGET_USD=6`을 유지한다.
3. 기본 모델은 `gpt-6-luna`, `store: false`, 비스트리밍 구조화 출력이다.
4. 실제 학생 사용 전 대표 P1~P6 사례를 국어 교사가 표본 검토한다.

## 3. Vercel

GitHub 저장소를 연결한 뒤 Development, Preview, Production 환경을 분리한다. Preview에는 운영 Supabase 키를 넣지 않는다.

필수 환경 변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-6-luna`
- 충분히 긴 임의 문자열인 `SAFETY_IDENTIFIER_SALT`
- `APP_ENV=production`
- `MAX_TURNS_PER_SESSION=30`
- `DAILY_TURN_LIMIT_PER_USER=40`
- `MONTHLY_OPENAI_BUDGET_USD=6`

## 4. 배포 승인

- `pnpm verify`와 `pnpm build` 통과
- Supabase migration 및 실제 RLS 테스트 통과
- 학생 초대 → 비밀번호 설정 → 로그인 → 학습 → 기록 확인 흐름 통과
- 교사가 자기 학급 학생만 볼 수 있고 다른 학급 학생은 볼 수 없음
- OpenAI 입력·출력 안전 검사와 예산 차단 확인
- 개인정보 처리방침, 학교 승인, 미성년자 보호 검토 완료

현재 배포는 기술 검증용이며 위 수동 보류 항목과 사람의 검토가 끝나기 전에는 수업 운영 승인 상태가 아니다.

## 5. 남은 수동 작업

1. OpenAI Billing에 크레딧을 충전하고 프로젝트 한도를 미화 6달러로 설정한다.
2. 초기 교사 이메일과 학급명을 확정해 계정과 학급을 생성한다.
3. 교사 초대 → 학생 비밀번호 설정 → 로그인 → 학습 → 기록 조회 → 교사 조회 흐름을 시험한다.
4. 국어 교사와 개인정보 담당자가 대표 대화, 보관·삭제 절차, 미성년자 안내를 승인한다.

OpenAI 교체 키는 2026-10-24 만료 예정이므로 그 전에 회전한다. 기존에 노출 가능성이 있었던 키는 폐기 상태를 확인했다.

환경 변수나 migration을 되돌려야 할 때는 Vercel의 직전 정상 배포로 롤백하고, 데이터베이스는 파괴적 다운 migration 대신 후속 migration으로 복구한다.
