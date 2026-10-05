# 문득문득

고등학생이 국어 「문장의 구조와 확장」 단원에서 문장을 직접 만들고, 확장하고, 비교하고, 수정하도록 돕는 학교 수업용 AI 글쓰기 도우미입니다.

## 기술 구성

- Next.js + TypeScript
- Vercel
- Supabase Auth + Postgres + RLS
- OpenAI Responses API
- GitHub Actions + 하네스 검증

## 화면 버전

- `mondeuk-v2` Git 태그: 일일 문법 로드맵까지 완성된 복구 지점
- ver.3: 첫 화면 전체를 스크롤 연동 3D 책으로 구성합니다. 표지가 열리고 문장 탐구 페이지로 들어간 뒤 마지막 장에서 학교 계정으로 바로 로그인할 수 있습니다. 로그인 뒤 `오늘의 챌린지 → 스스로 유형 학습 → 오답노트`는 오른쪽 책장을 넘기고, 반대 순서는 왼쪽 책장을 되돌리는 전환을 사용합니다. 움직임 축소 설정에서는 전환 없이 같은 기능을 제공합니다.

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

## 매일 문법 루틴

`/learn/self-study`는 문학 작품·실생활 자료·문장 만들기·개념학습을 4일 묶음마다 한 번씩, 날짜 기반의 섞인 순서로 제공하는 7일 로드맵입니다. 새로고침해도 그날의 유형은 바뀌지 않습니다. 오늘 노드를 누르면 같은 브라우저 탭이 `/learn/self-study/today`의 독립 학습 화면으로 전환됩니다. 학생이 자기 답을 쓰고 첫 AI 질문·피드백까지 받거나, 개념학습에서 단서를 거쳐 정답을 찾으면 해당 날짜가 완료되며 기존 `learning_events`의 학생별 RLS 범위 안에 완료 날짜가 저장됩니다. 시 활동은 구절 선택만으로 완료되지 않고, 선택을 바탕으로 제시된 질문에 학생이 직접 답해야 완료됩니다.

## 배포 상태

Production 공개 배포, Supabase 연결, GitHub 자동 배포 연결은 완료됐습니다. OpenAI 결제 크레딧·프로젝트 한도와 초기 교사 계정은 아직 준비되지 않아 실제 수업 운영 승인 상태는 아닙니다. 최신 완료·보류 항목은 [progress.md](./progress.md)와 [배포 체크리스트](./docs/deployment.md)를 기준으로 확인합니다.

자세한 범위와 단계는 [plan.md](./plan.md), 교육 원리는 [설계 원리.md](./설계%20원리.md), 기술 경계는 [architecture.md](./architecture.md), 배포 순서는 [docs/deployment.md](./docs/deployment.md)를 참고하세요.
