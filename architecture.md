# Architecture

## 경계

```text
Browser → Next.js on Vercel → Supabase Auth/RLS/Postgres
                         ├──→ Upstage/OpenAI Responses
                         └──→ OpenAI Moderation
```

- 브라우저는 Supabase publishable key만 사용한다.
- Upstage·OpenAI 키와 Supabase service role은 Next.js 서버에서만 사용한다.
- 학생과 교사 권한은 Supabase Auth 사용자, `profiles.role`, `class_memberships`로 판정한다.
- OpenAI 대화 저장은 끄고(`store: false`) 학습 이력은 Supabase에서 관리한다.

## 애플리케이션 모듈

- `src/app`: 학생·교사 화면과 서버 API
- `src/lib/agent`: 비계 상태 머신, 프롬프트, 구조화 응답
- `src/lib/safety`: 입력·출력 검사, 안전 식별자
- `src/lib/supabase`: 브라우저·서버·관리자 클라이언트
- `supabase/migrations`: 데이터 모델과 RLS
- `evals`: P1~P6 대표 사례

## 핵심 결정

- 학습 도우미: `UPSTAGE_API_KEY`가 있으면 `solar-mini4`, 없으면 `gpt-5-mini`
- 안전 검사: 공급자와 관계없이 OpenAI Moderation을 서버에서 유지
- 응답: 비스트리밍 Structured Output
- 비용: 월 미화 6달러 앱 한도, 세션별 30턴 제한
- 데이터 보관: 기본 무기한, 관리자 삭제·내보내기 가능
- 인증: 교사 초대 이메일 로그인, 공개 회원가입 비활성화
