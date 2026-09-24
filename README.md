# 문장나래

고등학생이 국어 「문장의 구조와 확장」 단원에서 문장을 직접 만들고, 확장하고, 비교하고, 수정하도록 돕는 학교 수업용 AI 글쓰기 도우미입니다.

## 기술 구성

- Next.js + TypeScript
- Vercel
- Supabase Auth + Postgres + RLS
- OpenAI Responses API
- GitHub Actions + 하네스 검증

## 로컬 실행

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

OpenAI와 Supabase 키가 없는 개발 환경에서는 `/learn`에서 규칙 기반 비계 엔진으로 UI 흐름을 확인할 수 있습니다. `APP_ENV=production`에서는 필수 키와 인증이 없으면 AI 요청을 거부합니다.

## 검증

```bash
pnpm verify
pnpm build
```

`pnpm verify`는 lint, 타입, 단위 테스트, P1~P6 추적, 비밀값·RLS·HTTP 보안 헤더 정적 검사, eval 명세 검사를 실행합니다. 실제 운영 전에는 별도 Supabase 테스트 프로젝트에서 `supabase/tests/rls.sql`도 실행해야 합니다.

## 배포 상태

Production 공개 배포, Supabase 연결, GitHub 자동 배포 연결은 완료됐습니다. OpenAI 결제 크레딧·프로젝트 한도와 초기 교사 계정은 아직 준비되지 않아 실제 수업 운영 승인 상태는 아닙니다. 최신 완료·보류 항목은 [progress.md](./progress.md)와 [배포 체크리스트](./docs/deployment.md)를 기준으로 확인합니다.

자세한 범위와 단계는 [plan.md](./plan.md), 교육 원리는 [설계 원리.md](./설계%20원리.md), 기술 경계는 [architecture.md](./architecture.md), 배포 순서는 [docs/deployment.md](./docs/deployment.md)를 참고하세요.
