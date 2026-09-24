# Progress

## 현재 단계

- 단계 1~5 구현 완료
- 단계 6 자동·운영 기초 검증 완료, 사람의 교육·개인정보 검토 대기
- 단계 7 Vercel Production 배포 완료, 공개 접근과 외부 서비스의 수동 설정 대기

## 완료

- Next.js 학생·교사 UI와 초대형 로그인 흐름
- 7개 전체 단원 활동과 5단계 비계 상태 머신
- OpenAI Responses API 구조화 출력, 입력·출력 moderation, 안전 식별자
- 월·일·세션 비용 제한과 운영 fallback 차단
- Supabase schema, 원자적 학습 기록 함수, RLS 정책
- 학생 학습 기록과 교사별 학생 진행 대시보드
- 교차 사용자 RLS SQL 테스트와 정적 보안 검사
- 하네스 문서, CI, 교육 원리 추적, 로컬 브라우저 점검
- GitHub `main` 커밋·푸시
- Supabase 운영 프로젝트 생성, migration 적용, 원격 RLS 음성 테스트 통과
- Supabase 보안 권고 0건과 공개 회원가입 차단 확인
- Vercel Production 환경 변수 등록 및 배포 완료
- 운영 화면 데스크톱·모바일 렌더링과 비로그인 API 차단 확인
- 앱 자체 CSP·HSTS·권한 정책 등 HTTP 보안 헤더를 코드와 정적 검사에 추가
- `pnpm verify` 및 `pnpm build` 통과

## 다음 작업

1. Vercel Deployment Protection을 검토하고 학교 사용자가 접근할 수 있게 Production 공개 범위를 승인
2. Vercel 계정의 GitHub Login Connection을 완료한 뒤 저장소 자동 배포 연결
3. OpenAI 결제 크레딧을 충전하고 프로젝트 사용 한도를 미화 6달러로 설정
4. 실제 OpenAI 호출로 P1~P6 응답 표본 평가
5. 초기 교사 이메일과 학급명을 정해 교사 계정·학급 생성
6. 학생 초대부터 학습 기록·교사 조회까지 인증된 E2E 검증
7. 국어 교사·학교 개인정보 담당자의 운영 승인

## 블로커

- Vercel Production이 현재 Vercel SSO 보호 상태여서 일반 학생이 접근할 수 없음
- Vercel 계정과 GitHub의 Login Connection이 완료되지 않아 Git 기반 자동 배포가 연결되지 않음
- OpenAI API 키는 등록됐지만 결제 크레딧과 프로젝트 하드 한도가 설정되지 않음
- 초기 교사 이메일·학급명이 없어 인증된 사용자 흐름을 만들 수 없음
- 학교의 이메일/비밀번호 방식 최종 승인, 개인정보·미성년자 보호 검토, 학교 디자인 자료 미확인
