# 고등학생 문장 구조·확장 글쓰기 AI 에이전트 작업 계획

## 0. 문서 상태

- 상태: MVP 구현·기초 배포 완료, 1~4차시 2장형·5차시 3장형 학습 과정 구현 완료 v1.5 (2026-09-25)
- 기준 문서: [`설계 원리.md`](./설계%20원리.md)
- 참고 하네스: [tigerjk9/Harness-Engineering](https://github.com/tigerjk9/Harness-Engineering)
- 목표 배포 구조: Vercel 프론트엔드 + Supabase 백엔드 + OpenAI API + GitHub 형상 관리
- 대상 GitHub 저장소: [tmvlem779/writing](https://github.com/tmvlem779/writing) (확인 시점 기준 빈 저장소)
- 확정 운영 조건: 특정 학교 수업용, 학생 로그인 필수, 교사 화면 포함, 한국어 전용, 전체 단원 대상
- 데이터 보관: 기본적으로 계속 보관하되 학교 관리자에 의한 삭제·내보내기 절차를 반드시 제공한다.
- OpenAI 월 예산: 10,000원 이내. 환율·세금·오차 여유를 두고 애플리케이션 내부 월 한도는 미화 6달러 상당으로 시작한다.
- 하네스 강도: 학생 데이터와 미성년자 대상 AI 기능을 다루므로 기본은 **균형형**, 인증·개인정보·안전 관련 변경은 **엄격형**으로 운영한다.

## 1. 제품 목표

고등학생이 국어의 「문장의 구조와 확장」 단원에서 문장을 직접 생성하고, 확장하고, 비교하고, 수정하고, 실제 글쓰기로 전이하도록 돕는 대화형 AI 에이전트를 만든다.

에이전트는 정답이나 완성 문장을 즉시 대신 작성하는 도구가 아니라 다음 순환을 지원하는 학습 도구여야 한다.

1. 학습자의 현재 수준과 취약점을 진단한다.
2. 학습자가 먼저 문장을 만들거나 판단하게 한다.
3. 필요한 만큼만 질문·단서·부분 구조·예시를 제공한다.
4. 학습자의 설명과 수정 근거를 요구한다.
5. 비계 사용 기록을 바탕으로 다음 과제의 난이도와 도움 수준을 조정한다.
6. 개별 문장 학습을 짧은 글쓰기로 전이하고 학습자가 변화를 성찰하게 한다.

## 2. MVP 범위

### 포함

- 학생 로그인. 기본안은 교사가 허용한 이메일 계정을 생성·초대하는 방식이며 공개 회원가입은 막는다.
- 1장 개념 학습: 문장·절, 이어진문장, 안은문장, 구조와 표현 효과
- 2장 적용 학습: 기존 진단부터 성찰까지의 AI 학습 과정
- 3장 전이 학습: 기사·안내문·대화·발표·인터뷰·학습자 SNS 자료 분석과 재구성
- 1~5차시 공통 선택: 1~4차시는 개념·쓰기, 5차시는 개념·쓰기·종합 실생활 탐구로 구성
- 시작 진단 활동
- 문장 생성 및 단계적 확장 활동
- 문장 구조와 의미·정보 초점 비교 활동
- 오류 발견 → 이유 설명 → 직접 수정 → 수정 전후 비교 활동
- 짧은 글쓰기 전·후 비교 및 성찰 활동
- 대화별 비계 수준, 도움 유형, 취약 영역, 작성본 이력 저장
- 학생이 자신의 세션과 이전 글을 다시 보는 화면
- 교사가 담당 학생의 진도, 글, 비계 사용, 취약 영역을 확인하는 화면
- OpenAI 입력·출력 안전 검사와 연령 적합 안내
- 운영자용 최소 로그: 오류, 지연 시간, 토큰 사용량, 안전 이벤트

### MVP에서 제외

- 자동 성적 산출 또는 생활기록부용 평가
- 교사를 대신하는 최종 평가·판정
- 여러 교과 지원
- 음성·이미지 입력
- 실시간 공동 편집
- 학생 간 공개 게시판
- 파인튜닝
- 학교 전체 통계나 다중 학교를 지원하는 대규모 관리자 대시보드

교사 화면은 MVP에 포함하며 교사-학급-학생 소속 관계를 RLS로 검증한다.

## 3. 설계 원리의 기능화

| 설계 원리 | 제품 동작 | 저장해야 할 증거 | 핵심 검증 |
| --- | --- | --- | --- |
| 1. 진단 기반 적응적 비계 | 시작 진단, 취약 영역 추적, 도움 수준의 단계적 상승과 감소 | 독립 해결 여부, 사용한 도움, 재시도 결과, 비계 수준 | 막혔을 때 비계가 단계적으로 높아지고 성공이 누적되면 낮아지는가 |
| 2. 단계적 문장 생성·확장 | 기본 문장 생성 후 조사·어미·수식어·절을 추가하며 확장 | 원문, 확장 단계, 선택한 언어 요소 | AI가 먼저 완성문을 주지 않고 학습자가 선택·생성하게 하는가 |
| 3. 다층적 질문 | 관찰 → 분석 → 설명 → 생성 → 평가 순의 질문 | 질문 유형, 학습자 답, 근거 설명 | 답 이후 근거를 묻고, 설명이 불명확하면 재표현을 요구하는가 |
| 4. 구조·의미 연계 | 같은 내용을 여러 구조로 표현하고 강조점·배경 정보·표현 효과 비교 | 비교 문장, 학생의 차이 설명 | 구조 변경이 의미와 표현 효과에 미친 차이를 학생이 설명하는가 |
| 5. 오류 기반 탐구·재구성 | 학생이 오류를 먼저 찾고 이유를 설명한 뒤 직접 수정 | 오류 후보, 학생 표시, 수정 전후 문장, 전이 과제 결과 | AI가 오류를 즉시 고치지 않고 탐구 기회를 보장하는가 |
| 6. 실제 글쓰기로의 전이·성찰 | 학습 전후 짧은 글, 실제 자료 재구성, 자기평가 | 전후 글, 잘된 문장, 수정할 문장, 도움받은 부분 | 개별 문장 학습이 새 글쓰기 상황에서 다시 사용되는가 |

## 4. 권장 기술 구조

### 프론트엔드

- Next.js App Router + TypeScript
- Vercel 배포
- Tailwind CSS를 기본 스타일 계층으로 사용
- 모바일과 학교 PC 환경을 모두 고려한 반응형 UI
- 대화만 보여 주지 않고 다음 학습 패널을 함께 제공
  - 현재 과제
  - 학생 작성 문장
  - 구조 분석 또는 비교 영역
  - AI 질문·힌트
  - 수정 전후 비교
  - 도움 수준과 학습 진행 상태

### 애플리케이션 서버

- Next.js Route Handler 또는 Server Action에서 OpenAI API를 호출한다.
- `OPENAI_API_KEY`는 브라우저에 절대 노출하지 않는다.
- 입력 검증, 인증 확인, 사용량 제한, 안전 검사, 프롬프트 조립, 응답 스키마 검증을 서버에서 수행한다.
- Vercel의 실행 시간 제한을 고려해 요청당 한 번의 주 응답과 필요한 최소 안전 검사만 실행한다.

### 백엔드

- Supabase Auth: 교사 초대 기반 이메일 로그인. 학교에서 Google Workspace를 요구하면 Google OAuth로 교체할 수 있게 인증 계층을 분리
- Supabase Postgres: 세션, 초안, 대화, 진단, 숙달 상태, 안전 이벤트 저장
- Row Level Security(RLS): 학생은 자신의 데이터만 조회·수정
- Supabase CLI migration으로 스키마와 정책을 코드화
- 서비스 역할 키는 서버 전용이며 일반 데이터 접근은 사용자 JWT와 RLS를 우선 사용

### OpenAI

- Responses API 사용
- 기본 모델은 저비용·고빈도 작업용 `gpt-6-luna`로 시작하고 모델명은 `OPENAI_MODEL` 환경 변수로 분리한다.
- 앱이 대화 이력을 Supabase에서 관리하고 필요한 최근 맥락과 학습 상태만 요청에 포함한다.
- 미성년자 데이터 보호를 위해 초기안은 `store: false`를 기본으로 한다.
- 사용자 ID 또는 세션 ID를 개인정보가 드러나지 않게 해시하여 `safety_identifier`로 보낸다.
- UI가 안정적으로 렌더링하도록 Structured Outputs와 서버 측 스키마 검증을 사용한다.
- 초기 MVP는 출력 안전 검사를 완료한 뒤 응답을 노출하는 비스트리밍 방식을 권장한다. 스트리밍은 부분 출력 검사가 어렵기 때문에 안전 설계와 UX 검증 후 별도 도입한다.
- 한 요청의 출력 토큰, 학생별 일일 호출 수, 서비스 전체 월간 추정 비용에 상한을 둔다. 월간 추정 비용이 미화 6달러에 도달하면 교사에게 알리고 새 AI 호출을 중지하되 기존 글 열람·수정은 유지한다.

### 요청 흐름

```text
학생 브라우저
  → Vercel의 Next.js 서버
      → Supabase Auth로 사용자/세션 확인
      → 입력 형식·길이·속도 제한
      → 입력 안전 검사
      → 설계 원리 + 학습 상태 + 최근 대화로 프롬프트 구성
      → OpenAI Responses API 호출
      → 구조화 응답 검증 + 출력 안전 검사
      → Supabase에 학습 증거와 사용량 저장
  ← 학습 질문·힌트·다음 행동 렌더링
```

## 5. 화면과 사용자 흐름

### 5.1 시작

1. AI 도구임을 알리고 사용 목적과 한계를 연령에 맞게 안내한다.
2. 개인정보를 입력하지 말아야 한다는 안내를 제공한다.
3. 교사가 초대한 학교 계정으로 로그인한다. 공개 회원가입과 익명 학습 저장은 제공하지 않는다.
4. 학습 목표와 활동 유형을 선택한다.

### 5.2 진단

1. 짧은 문장 생성 과제를 제시한다.
2. 문장 성분, 호응, 조사·어미, 문장 확장에 관한 수행을 확인한다.
3. 정오 판정만 하지 않고 학생의 판단 근거를 묻는다.
4. 초기 취약 영역과 비계 수준을 생성한다.

### 5.3 학습 루프

1. 학생이 문장 또는 설명을 제출한다.
2. 서버가 입력 안전성과 세션 상태를 확인한다.
3. 에이전트가 현재 학습 단계를 판정한다.
4. 학생이 독립적으로 답할 수 있으면 다음 난이도로 이동한다.
5. 막힌 경우 아래 순서로 비계를 높인다.
   - 0단계: 재질문 또는 관찰 질문
   - 1단계: 초점 단서
   - 2단계: 선택지 또는 대조 질문
   - 3단계: 부분 문장 구조 또는 비교 예문
   - 4단계: 모범 예문과 직접 설명
6. 해결 후에는 비계를 낮추고 새 어휘·상황의 전이 문제를 제시한다.

### 5.4 마무리

1. 학생이 잘 표현한 문장과 수정이 필요한 문장을 선택한다.
2. 사용한 도움과 어려웠던 부분을 스스로 평가한다.
3. 학습 전후 글에서 달라진 구조와 표현 방식을 설명한다.
4. 다음 세션의 추천 활동을 보여 준다.

## 6. AI 에이전트 설계

### 6.1 프롬프트 계층

1. `설계 원리.md`: 교육 설계의 단일 기준 문서
2. `prompts/system.md`: 역할, 금지 행동, 비계 단계, 응답 원칙
3. `prompts/activity/*.md`: 진단, 문장 생성, 구조 비교, 오류 탐구, 전이·성찰 활동별 지침
4. 런타임 상태: 학습 목표, 취약 영역, 현재 비계, 이전 시도, 최근 대화
5. 학생 입력: 신뢰할 수 없는 데이터로 취급하고 시스템 규칙과 분리

설계 원리의 각 항목에는 `P1`~`P6`, 세부 지침에는 `P1.1` 같은 ID를 부여한다. 프롬프트 규칙, 테스트 사례, 평가 결과가 어떤 설계 지침을 구현하는지 추적할 수 있어야 한다.

### 6.2 응답 스키마 초안

```json
{
  "mode": "diagnose | question | hint | compare | revise | model | reflect",
  "scaffoldLevel": 0,
  "studentMessage": "학생에게 보여 줄 짧은 응답",
  "question": "학생이 다음에 답할 질문",
  "focusConcepts": ["주어-서술어 호응"],
  "observations": ["서술어와 호응하는 주어 확인 필요"],
  "nextAction": "rewrite | explain | compare | expand | transfer",
  "masteryEvidence": [],
  "safety": {
    "blocked": false,
    "reason": null
  }
}
```

- 실제 구현에서는 Zod와 OpenAI Structured Outputs가 공유하는 스키마를 사용한다.
- `scaffoldLevel`은 서버의 허용 범위와 상태 전이 규칙으로 다시 검증한다.
- 모델의 진단은 확정적 능력 판정이 아니라 해당 활동에서 관찰한 근거로만 표현한다.
- 안전 거절, 불완전 응답, 스키마 검증 실패, API 오류를 각각 처리한다.

### 6.3 상태 전이 규칙

- 독립 해결 성공이 누적되면 같은 개념의 비계를 한 단계 낮춘다.
- 같은 오류가 반복되면 즉시 정답을 주지 않고 질문 → 단서 → 부분 구조 순으로 높인다.
- 4단계 설명을 제공한 뒤에는 같은 문장을 반복시키지 않고 새 어휘·상황의 전이 과제를 낸다.
- 학습자가 도움을 요청하면 현재 단계보다 한 단계 높은 비계를 허용하되, 답을 대신 작성하는 요청은 학습 목표에 맞게 재구성한다.
- 에이전트는 학생의 글 전체를 임의로 교체하지 않고 수정 이유와 선택지를 제공한다.

## 7. 데이터 모델 초안

모든 사용자 소유 테이블에는 `user_id`, `created_at`, `updated_at`을 두고 RLS를 적용한다.

| 테이블 | 용도 | 핵심 필드 |
| --- | --- | --- |
| `profiles` | 최소 사용자 설정 | `user_id`, `display_alias`, `role`, `consent_version` |
| `classes` | 학교 수업 단위 | `id`, `name`, `teacher_id`, `invite_code_hash`, `active` |
| `class_memberships` | 교사·학생 소속 관계 | `class_id`, `user_id`, `role`, `status` |
| `learning_sessions` | 학습 세션 | `id`, `user_id`, `activity_type`, `status`, `started_at`, `ended_at` |
| `drafts` | 학생의 문장·글 버전 | `id`, `session_id`, `parent_id`, `content`, `revision_reason` |
| `turns` | 학생과 AI의 상호작용 | `id`, `session_id`, `actor`, `content`, `response_json`, `prompt_version` |
| `concept_states` | 개념별 학습 상태 | `user_id`, `concept_code`, `scaffold_level`, `evidence_count`, `last_seen_at` |
| `learning_events` | 비계·재시도·성공 기록 | `session_id`, `event_type`, `concept_code`, `metadata` |
| `safety_events` | 최소화된 안전 기록 | `session_id`, `category`, `action`, `review_status` |
| `api_usage` | 비용·성능 관측 | `session_id`, `model`, `input_tokens`, `output_tokens`, `latency_ms`, `status` |
| `prompt_versions` | 프롬프트 변경 추적 | `version`, `source_commit`, `principle_ids`, `active` |

원문 대화와 학생 글은 기본적으로 계속 보관한다. 다만 학교 관리자는 학급 또는 학생 단위로 내보내기·삭제할 수 있어야 하고, 법률·학교 정책·학생 권리 요청에 따른 삭제를 막는 불변 보관으로 구현하지 않는다. 분석 로그에는 학생 원문을 복제하지 않는다.

## 8. 하네스 구조

참고 저장소의 헌법·작업 구조·검증·실행 루프를 이 프로젝트와 Codex/GitHub 환경에 맞게 적용한다.

```text
project/
├── AGENTS.md                       # 프로젝트 헌법, 에이전트 역할, 금지사항, 완료 기준
├── architecture.md                 # 기술 구조, 경계, 데이터 흐름, 데이터 모델
├── progress.md                     # 현재 상태, 다음 작업, 블로커, 최근 검증 결과
├── HARNESS_CHANGELOG.md            # 하네스 규칙 변경 이력
├── plan.md                         # 전체 작업 계획
├── 설계 원리.md                    # 교육 설계의 단일 기준 문서
├── docs/
│   ├── product-requirements.md     # 사용자·범위·사용자 흐름
│   ├── learning-design.md          # P1~P6 기능 매핑과 활동 설계
│   ├── verification-rubric.md      # 6차원 품질 루브릭
│   ├── decision-log.md             # ADR 형식의 결정 기록
│   ├── privacy-and-retention.md    # 미성년자 데이터 최소화·보관·삭제 정책
│   ├── threat-model.md             # 인증, RLS, 프롬프트 주입, 비밀키 위협 모델
│   └── accessibility-checklist.md  # WCAG 기반 체크리스트
├── prompts/
│   ├── system.md
│   ├── activity/
│   └── VERSION
├── evals/
│   ├── cases/                      # 설계 지침별 정상·경계·공격 사례
│   ├── fixtures/
│   └── rubric.ts
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── tests/                      # RLS 및 데이터 무결성 테스트
├── scripts/
│   ├── verify.mjs                  # 로컬·CI 공통 검증 진입점
│   ├── check-principle-coverage.mjs
│   └── check-env.mjs
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/agent/
│   ├── lib/supabase/
│   └── lib/safety/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/workflows/ci.yml
├── .husky/pre-commit
└── .env.example
```

### 에이전트 역할

`AGENTS.md`에 다음 역할과 권한 경계를 정의한다.

1. 조정자: 범위, 완료 조건, 영향 파일 관리
2. 교육 설계 검토자: `설계 원리.md`와 기능·응답의 정합성 확인
3. 프론트엔드 담당: 학생 UX와 접근성
4. 백엔드·데이터 담당: Supabase schema, migration, RLS
5. AI·프롬프트 담당: Responses API, 구조화 출력, 프롬프트, eval
6. 안전·개인정보 담당: 미성년자 보호, 데이터 최소화, 위협 모델
7. QA·배포 담당: 자동 테스트, Vercel Preview, 운영 점검

한 에이전트가 모든 역할을 수행하더라도 각 검토 관점을 별도의 체크로 남긴다. 보안·개인정보·루브릭 변경은 사람의 승인을 받아야 한다.

### 7단계 실행 루프

모든 기능은 다음 순서로 진행한다.

1. 계획: 영향 파일, 데이터, 위험, 롤백 방법 확인
2. 완료 조건 합의: 기능·교육·안전·접근성 기준을 테스트 가능한 문장으로 정의
3. 교육 설계: 관련 P1~P6 지침과 학습자 행동을 연결
4. 구현: 작은 단위로 코드·migration·테스트를 함께 작성
5. 교육학 검토: 정답 선제 제공, 과도한 교정, 비계 순서, 자기설명 기회 확인
6. 검증: 자동 검사와 수동 시나리오를 실행해 루브릭 점수 산출
7. 하네스 진화: 반복된 실패만 새 규칙으로 제안하고 사람이 승인한 뒤 기록

## 9. 검증 체계

### 9.1 6차원 루브릭

| 차원 | 주요 검사 |
| --- | --- |
| 기능 정확성 | 핵심 흐름, 상태 전이, 저장·복구, 오류 처리 |
| 교육 설계 정합성 | P1~P6 적용, 비계 단계, 학생 생성·설명·수정 기회 |
| AI 품질·안전 | 스키마 준수, 금지 행동, 연령 적합성, 공격 입력, 안전 거절 |
| 보안·개인정보 | RLS, 인증, 비밀키, 데이터 최소화, 보관·삭제, 감사 로그 |
| 접근성·사용성 | 키보드, 포커스, 레이블, 대비, 오류 안내, 모바일 |
| 유지보수·배포 | 타입, lint, 테스트, migration, 문서, Preview·Production 분리 |

- 초기 승인 기준: 총점 85점 이상
- 보안·개인정보 또는 미성년자 안전에 치명적 결함이 있으면 총점과 관계없이 REJECTED
- 교육 설계 정합성에서 핵심 원리 하나라도 검증 사례가 없으면 REJECTED
- 루브릭 수치와 통과 기준의 변경은 코드 변경과 분리해 사람의 승인을 받는다.

### 9.2 자동 검사

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:a11y`
- `npm run eval`
- `npm run verify`
- Supabase migration 재현 및 RLS 음성 테스트
- 비밀키·`.env` 커밋 검사
- `설계 원리.md`의 P1~P6가 프롬프트와 eval에 모두 연결되었는지 검사

### 9.3 AI 평가 사례

- 학생이 처음부터 완성 답안을 요구한다.
- 학생이 두 번 실패한 뒤 도움을 요청한다.
- 학생이 스스로 해결한 뒤 에이전트가 불필요한 설명을 계속한다.
- 문법적으로 가능하지만 의미 초점이 다른 두 문장을 비교한다.
- 오류 문장을 AI가 즉시 고쳐 버리려는 상황을 검사한다.
- 학생 설명이 모호할 때 근거와 재표현을 요구하는지 검사한다.
- 새 어휘와 상황으로 전이 문제가 생성되는지 검사한다.
- 프롬프트 무시, 시스템 지침 노출, 역할 변경 요청을 방어하는지 검사한다.
- 개인정보, 자해, 폭력, 성적 내용 등 연령 민감 입력의 처리와 보고 경로를 검사한다.

AI 자동 채점만으로 승인하지 않는다. 국어 교육 전문가가 대표 사례를 주기적으로 검토한다.

## 10. 보안·개인정보·미성년자 안전

- 서비스 첫 화면에 AI 사용 안내, 한계, 개인정보 입력 금지, 신고 방법을 제공한다.
- 이름, 학교, 학번, 연락처 등은 기능에 꼭 필요하지 않으면 수집하지 않는다.
- 학생 글과 대화를 OpenAI에 보낼 때 내부 사용자 정보와 분리한다.
- OpenAI 요청은 서버에서만 수행하고 API 키를 GitHub·브라우저·로그에 남기지 않는다.
- 입력과 출력에 안전 검사를 적용하고 고위험 상호작용의 신고·검토 경로를 둔다.
- OpenAI 요청에 개인정보를 드러내지 않는 `safety_identifier`를 사용한다.
- 계정·세션·IP 단위 속도 제한, 일일 토큰 한도, 비정상 사용 탐지를 적용한다.
- 학생 데이터 테이블은 기본 비공개이며 모든 정책을 deny-by-default로 시작한다.
- RLS 정책은 소유자 허용 테스트뿐 아니라 다른 사용자 접근 실패 테스트를 반드시 둔다.
- 로그에는 원문 대신 이벤트 유형, 토큰 수, 지연 시간, 오류 코드 등 최소 정보만 남긴다.
- 데이터 보관 기간, 삭제 요청, 백업 삭제, 운영자 열람 절차를 문서화한다.
- 한국에서 실제 학교나 학생에게 제공할 경우 적용되는 개인정보·아동·청소년 관련 법률과 학교 정책을 별도로 검토한다.

## 11. GitHub·배포 운영

### 브랜치와 PR

- `main`: Production
- `develop`은 선택 사항이며 소규모 프로젝트라면 생략
- 기능 브랜치: `feat/...`, 수정: `fix/...`, 문서: `docs/...`
- 모든 기능 변경은 PR과 Vercel Preview에서 검증한 뒤 `main`에 병합
- Conventional Commits 사용
  - `feat: add adaptive scaffold state machine`
  - `test: add P5 error exploration eval cases`
  - `docs: record student data retention decision`

### CI

PR마다 다음을 실행한다.

1. 의존성 고정 설치
2. lint·typecheck
3. 단위·통합 테스트
4. 프롬프트/eval 정적 검사
5. build
6. 접근성·E2E 검사
7. migration 및 RLS 검사
8. `verify.mjs` 루브릭 결과 게시

### 환경 분리

- Local: 로컬 Supabase 또는 개발 프로젝트
- Preview: PR별 Vercel Preview + 별도 Supabase 개발/스테이징 데이터
- Production: `main` 배포 + 운영 Supabase
- Preview가 운영 학생 데이터에 접근하지 않도록 키와 프로젝트를 분리한다.
- 환경 변수 변경 후에는 새 배포가 필요하다는 점을 배포 체크리스트에 포함한다.

## 12. 환경 변수 초안

```dotenv
# Browser-safe Supabase settings
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server only
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
SAFETY_IDENTIFIER_SALT=

# App configuration
APP_ENV=development
MAX_TURNS_PER_SESSION=30
MAX_INPUT_CHARS=4000
DAILY_TOKEN_LIMIT_PER_USER=
MONTHLY_OPENAI_BUDGET_USD=6
DATA_RETENTION_DAYS=0
```

- `.env.local`은 커밋하지 않는다.
- `.env.example`에는 값이 아니라 변수명과 설명만 둔다.
- `NEXT_PUBLIC_` 접두사가 붙은 값만 브라우저에 노출 가능하다.
- 서비스 역할 키와 OpenAI 키는 Vercel 서버 환경 변수로만 설정한다.

## 13. 구현 단계

### 단계 0. 결정 확정

- 남은 인증 세부 방식과 학교 UI 요구사항 확정
- MVP 사용자와 운영 환경 정의
- 데이터 보관·삭제 정책 승인
- 성공 지표와 비용 상한 승인

완료 조건: 결정 대기 항목이 `docs/decision-log.md`에 기록되고 구현을 막는 미정 사항이 없다.

### 단계 1. 저장소와 하네스 초기화

- Git 저장소 초기화 또는 기존 GitHub 저장소 연결
- Next.js TypeScript 프로젝트 생성
- 하네스 파일과 디렉터리 생성
- Husky, lint, typecheck, unit test, CI 기본 구성
- `설계 원리.md`에 P1~P6 추적 ID 정의

완료 조건: 빈 앱이 로컬에서 실행되고 PR에서 기본 검증과 Vercel Preview가 성공한다.

### 단계 2. Supabase 기반 구축

- 개발·운영 프로젝트 분리
- Auth 방식 적용
- schema migration과 RLS 작성
- 세션·초안 저장 API 구현
- 다른 사용자 데이터 접근 실패 테스트

완료 조건: 학생이 자신의 초안만 생성·조회·수정·삭제할 수 있다.

### 단계 3. 핵심 학습 UI

- 시작 안내와 진단 화면
- 문장 생성·확장 작업 화면
- AI 질문·힌트 패널
- 수정 전후 비교와 성찰 화면
- 모바일·키보드 접근성 적용

완료 조건: OpenAI 없이 고정 fixture로 전체 학습 흐름을 완료할 수 있다.

### 단계 4. OpenAI 에이전트 연결

- 프롬프트 빌더와 버전 관리
- Responses API 서버 경로
- Structured Outputs와 Zod 검증
- 비계 상태 머신
- 입력·출력 안전 검사
- 비용·지연·오류 관측

완료 조건: P1~P6 대표 eval이 통과하고 응답 실패가 학생 데이터 손실로 이어지지 않는다.

### 단계 5. 적응·전이·성찰

- 개념별 상태 업데이트
- 독립 성공과 도움 사용 구분
- 비계 상승·감소 규칙 적용
- 새 상황 전이 과제
- 전후 글 비교와 자기평가

완료 조건: 최소 세 종류의 학습 경로에서 상태 변화가 테스트로 재현된다.

### 단계 6. 안전·품질 강화

- 미성년자 안전 시나리오와 신고 경로
- 프롬프트 공격·과도한 대필·오프토픽 방어
- RLS, 속도 제한, 비밀키, 로그 최소화 검토
- 국어 교육 전문가의 대표 대화 검토
- 접근성·부하·비용 테스트

완료 조건: 6차원 루브릭 승인, 치명적 결함 0건, 운영 체크리스트 완료.

### 단계 7. 배포와 관찰

- Vercel Production 연결
- GitHub 보호 규칙과 배포 승인 설정
- 운영 환경 변수와 Supabase migration 적용
- 오류율, 지연 시간, 토큰 비용, 안전 이벤트 모니터링
- 제한된 학생 집단으로 파일럿 후 개선

완료 조건: 롤백 절차, 장애 대응 담당, 데이터 삭제 절차가 실제로 검증된다.

## 14. MVP 완료 기준

- 학생이 진단 → 문장 생성·확장 → 구조 비교 또는 오류 탐구 → 전이 글쓰기 → 성찰 흐름을 완료할 수 있다.
- 모든 AI 응답이 `설계 원리.md`의 지침과 연결된 프롬프트·평가 사례를 가진다.
- AI가 처음부터 학생의 글을 대신 완성하지 않고 단계적 비계를 제공한다.
- 독립 해결과 AI 도움 해결이 구분되어 저장된다.
- 학생별 비계 수준이 증거에 따라 상승·감소한다.
- OpenAI 키와 Supabase 서비스 키가 브라우저와 Git 이력에 노출되지 않는다.
- 모든 사용자 데이터 테이블에 RLS가 적용되고 교차 사용자 접근 실패가 자동 검증된다.
- 미성년자 안내, 안전 필터, 신고·검토 경로, 데이터 삭제 절차가 존재한다.
- GitHub PR에서 CI와 Vercel Preview 검증이 통과해야 Production에 병합할 수 있다.
- 운영자가 모델별 토큰 사용량, 지연 시간, 오류율을 확인할 수 있다.

## 15. 주요 위험과 대응

| 위험 | 대응 |
| --- | --- |
| AI가 학생 대신 글을 작성 | 응답 모드 제한, 비계 단계 규칙, 대필 eval, 수정 이유 요구 |
| 문법 설명의 오류 | 검증 사례와 전문가 표본 검토, 근거 없는 확정 표현 제한 |
| 프롬프트 주입 | 학생 입력을 데이터로 분리, 시스템 지침 비공개, 공격 eval |
| 학생 개인정보 노출 | 최소 수집, `store: false`, 해시 식별자, 로그 원문 최소화 |
| 다른 학생 데이터 접근 | RLS deny-by-default, 교차 사용자 음성 테스트 |
| 비용 급증 | 입력 길이·세션 턴·일일 토큰 제한, 모델 환경 변수화, 사용량 경보 |
| 긴 응답과 느린 UX | 응답 길이 제한, 단일 다음 행동, 필요 맥락만 전송 |
| 스트리밍 중 부적절 내용 노출 | MVP 비스트리밍, 출력 검사 후 표시 |
| 하네스가 형식화되고 품질이 정체 | 실제 실패에서만 규칙 추가, 루브릭은 사람이 승인 |

## 16. 결정 기록과 남은 확인 사항

### 확정

- 특정 학교 수업용 비공개 서비스
- 학생 로그인 필수
- 교사용 학생 글·대화·진도 화면을 MVP에 포함
- 학생 글과 대화는 기본적으로 계속 보관
- 「문장의 구조와 확장」 전체 단원 지원
- OpenAI 비용 월 10,000원 이내
- GitHub 저장소: `https://github.com/tmvlem779/writing`
- 한국어 전용

### 구현 중 기본값으로 둔 사항

- 인증: 교사가 허용한 이메일 계정을 생성·초대하고 공개 회원가입은 차단한다.
- 모델: `gpt-6-luna`, 비스트리밍, 짧은 구조화 응답
- 비용 안전선: 미화 6달러 상당의 앱 내부 한도와 OpenAI 계정 사용량 알림을 함께 사용한다.

### 추후 확인

1. 학교에서 이메일·비밀번호 로그인을 사용할지, Google Workspace 학교 계정 로그인을 사용할지 확인한다.
2. 학교·기관 로고와 지정 색상 등 별도 디자인 기준이 있는지 확인한다.

## 17. 참고 자료

- [Harness-Engineering](https://github.com/tigerjk9/Harness-Engineering): 헌법, 작업 구조, 검증, 실행 루프와 7단계 사이클
- [OpenAI Responses API 대화 상태](https://developers.openai.com/api/docs/guides/conversation-state): Responses API와 대화 상태 관리 방식
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): 응답 스키마 준수와 거절·불완전 응답 처리
- [OpenAI Streaming](https://developers.openai.com/api/docs/guides/streaming-responses): 스트리밍 방식과 부분 출력의 moderation 위험
- [OpenAI Safety Best Practices](https://developers.openai.com/api/docs/guides/safety-best-practices): moderation, 사람의 검토, safety identifier
- [OpenAI Under-18 Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance): 미성년자 대상 안내, 필터, 모니터링과 신고 경로
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs): Next.js, Cookie 기반 Auth, TypeScript, RLS 구성
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side): SSR 환경의 세션 관리
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables): Development, Preview, Production 환경 변수 분리

## 18. 비교 수업안 확장 작업

### 목표

- 기존 5차시 `A안 · 문장 구조 중심`을 그대로 유지한다.
- 교과서 86~111쪽을 반영한 `B안 · 구조+문법 요소` 5차시를 별도 데이터로 추가한다.
- 학생이 같은 화면에서 두 수업안을 전환해 나중에 수업 결과를 비교할 수 있게 한다.

### 완료 조건

- A안의 차시·개념·과제·실생활 자료가 변경 없이 동작한다.
- B안은 요청된 다섯 차시와 각 차시별 1장 개념·2장 쓰기 활동을 제공한다.
- B안 4차시는 시간·높임·피동/사동·부정 표현을 형태와 의미 효과로 연결한다.
- B안 5차시는 생성·변형·자기 설명으로 마무리하고, 여섯 실생활 자료는 별도 `날개` 탭에서 구조와 문법 요소를 종합 적용한다.
- B안의 각 1장 개념 정리는 교과서 하위 범주에 맞춰 3개 이상의 소주제로 세분화하고, 자기 확인 문항을 차시당 3개 이상 제공한다.
- AI 요청에 수업안·차시·핵심 질문·과제가 포함되고 프롬프트 버전이 갱신된다.
- 관련 교육과정 테스트, 개인정보 검사, `pnpm verify`, Production 빌드가 통과한다.

### 롤백

- 새 B안과 날개 선택 UI 및 `grammar*` 교육과정 데이터만 제거하면 기존 A안은 기본값으로 계속 동작한다.
