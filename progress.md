# Progress

## 현재 단계

- 단계 1~5 로컬 구현 완료
- 단계 6 검증과 단계 7 실제 서비스 연결 대기

## 완료

- Next.js 학생·교사 UI와 초대형 로그인 흐름
- 7개 전체 단원 활동과 5단계 비계 상태 머신
- OpenAI Responses API 구조화 출력, 입력·출력 moderation, 안전 식별자
- 월·일·세션 비용 제한과 운영 fallback 차단
- Supabase schema, 원자적 학습 기록 함수, RLS 정책
- 학생 학습 기록과 교사별 학생 진행 대시보드
- 교차 사용자 RLS SQL 테스트와 정적 보안 검사
- 하네스 문서, CI, 교육 원리 추적, 로컬 브라우저 점검
- `pnpm verify` 및 `pnpm build` 통과

## 다음 작업

1. 실제 Supabase 개발 프로젝트 생성·migration 적용·RLS 테스트 실행
2. 실제 OpenAI 키로 P1~P6 응답 표본 평가
3. GitHub 원격 저장소에 최초 커밋·푸시
4. Vercel 프로젝트 연결과 Preview 검증
5. 국어 교사·학교 개인정보 담당자의 운영 승인

## 블로커

- 실제 Supabase 프로젝트 URL·publishable key·service role key 미입력
- 실제 OpenAI API 키 미입력
- Vercel 프로젝트와 배포 권한 미연결
- 학교의 이메일/비밀번호 방식 최종 승인 및 학교 디자인 자료 미확인
