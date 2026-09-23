# 프로젝트 헌법

## 목적

이 프로젝트는 고등학생이 문장 구조와 확장을 탐구하며 스스로 글을 개선하도록 돕는다. AI는 학생 대신 글을 완성하는 대필자가 아니라 진단, 질문, 단계적 비계, 비교, 성찰을 제공하는 학습 조력자다.

## 절대 규칙

1. `설계 원리.md`를 교육 설계의 단일 기준으로 사용한다.
2. 학생에게 완성 답안을 먼저 주지 않는다. 질문 → 단서 → 대조 → 부분 구조 → 직접 설명 순으로 비계를 높인다.
3. 학생 데이터는 최소 수집하고 다른 학생에게 절대 노출하지 않는다.
4. OpenAI 키와 Supabase 서비스 역할 키를 클라이언트 코드, 로그, Git에 넣지 않는다.
5. 사용자 소유 데이터에는 RLS와 교차 사용자 접근 실패 테스트가 필요하다.
6. 미성년자 안전, 개인정보, RLS, 평가 루브릭 변경은 사람의 검토 없이 완화하지 않는다.
7. 기능 변경에는 관련 테스트와 문서 변경을 포함한다.
8. Production에서는 인증·안전 검사·예산 검사를 우회하는 fallback을 허용하지 않는다.

## 완료 절차

모든 작업은 계획 → 완료 조건 → 교육 설계 → 구현 → 교육학 검토 → 검증 → 하네스 진화 순으로 진행한다. `pnpm verify`가 실패한 상태를 완료로 보고하지 않는다.

## 역할

- 조정자: 범위, 의존성, 완료 조건, 롤백
- 교육 설계: P1~P6 정합성, 비계 순서, 자기설명 기회
- 프론트엔드: 학생·교사 UX, 접근성
- 데이터: migration, RLS, 권한
- AI: 프롬프트, 구조화 출력, eval, 비용
- 안전: 미성년자 보호, moderation, 개인정보
- QA: 자동 검증, Preview, 배포 준비

## 변경 규칙

- 반복된 실패에서만 새 규칙을 제안한다.
- 규칙 변경 이유와 영향을 `HARNESS_CHANGELOG.md`에 기록한다.
- 루브릭을 코드에 맞춰 낮추지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
