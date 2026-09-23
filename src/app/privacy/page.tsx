export default function PrivacyPage() {
  return (
    <article className="policy-page">
      <span className="eyebrow">학생 데이터 안내</span>
      <h1>학습 기록을 왜, 어떻게 저장하나요?</h1>
      <section><h2>저장하는 정보</h2><p>학생이 작성한 문장과 글, AI와 주고받은 질문, 사용한 도움 단계, 수정 이력을 저장합니다. 다음 활동의 난이도를 조절하고 학습 전후 변화를 확인하기 위한 정보입니다.</p></section>
      <section><h2>저장하지 않으려는 정보</h2><p>학습에 필요하지 않은 주소, 전화번호, 주민등록번호 같은 개인정보는 받지 않습니다. 문장에도 개인을 알아볼 수 있는 정보를 쓰지 마세요.</p></section>
      <section><h2>열람과 보관</h2><p>학생은 자신의 기록만, 교사는 담당 학급 학생의 기록만 볼 수 있습니다. 기록은 수업의 연속성을 위해 계속 보관되며 학교 관리자는 필요한 경우 내보내거나 삭제할 수 있습니다.</p></section>
      <section><h2>AI 사용</h2><p>OpenAI에는 학습에 필요한 문장과 최근 맥락만 보내며, 내부 사용자 ID는 해시 처리합니다. AI는 틀릴 수 있으므로 중요한 내용은 교사와 확인하세요.</p></section>
      <section><h2>도움과 신고</h2><p>불편하거나 위험한 응답, 삭제 요청, 계정 문제는 담당 교사에게 알려 주세요.</p></section>
    </article>
  );
}
