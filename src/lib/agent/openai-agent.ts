import OpenAI from "openai";
import { resolveOpenAiModel } from "./model";
import { applyTutorResponsePolicy } from "./response-policy";
import { agentResponseJsonSchema, agentResponseSchema, type AgentResponse, type TurnRequest } from "./schema";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./system-prompt";

export async function runOpenAiAgent(
  client: OpenAI,
  request: TurnRequest,
  safetyIdentifier: string
): Promise<{ response: AgentResponse; usage: { input: number; output: number }; model: string }> {
  const model = resolveOpenAiModel();
  const history = request.history.map((item) => `${item.role === "student" ? "학생" : "튜터"}: ${item.content}`).join("\n");
  const thirdHintForQuestion = request.supportMode === "hint" && request.questionHintCount >= 2;
  const boundedQuestionFlow = request.message.includes("[학습 질문 진행]");
  const input = `
활동: ${request.activity}
요청 유형: ${request.supportMode === "hint" ? "AI 힌트 요청" : "도움 없이 답 제출"}
현재 비계 단계: ${request.scaffoldLevel}
현재 질문: ${request.currentQuestion || "현재 과제"}
현재 질문의 앞선 부적절·불완전 답변: ${request.questionAttemptCount}회
현재 질문의 앞선 힌트 사용: ${request.questionHintCount}회
최근 대화:\n${history || "없음"}
학생 입력:\n${request.message}

${thirdHintForQuestion
    ? "이번 요청은 같은 질문의 세 번째 힌트다. 현재 질문의 답만 resolvedQuestionAnswer에 직접 알려 주고 questionResolution을 reveal_and_advance로 둔 뒤, 활동 완료 기준에서 아직 확인하지 않은 다음 학습 질문 하나를 question에 제시하라. 활동 전체를 끝내지 마라."
    : request.supportMode === "hint"
    ? "정답이나 완성 문장을 주지 말고 현재 질문의 문구는 바꾸지 않은 채, studentMessage에 현재 단계에 맞는 단서 하나만 제공하라."
    : "학생이 AI 도움 없이 낸 답을 먼저 진단하고, 정오 판단의 근거를 묻는 다음 행동 하나만 요청하라."}
현재 답만 보지 말고 최근 대화에 있는 학생의 앞 답과 현재 답을 합쳐 활동 완료 기준 충족 여부를 판정하라.
${boundedQuestionFlow
    ? `이 활동에서는 현재 핵심 질문에 정확히 답했을 때만 answerStatus를 met, questionResolution을 advance로 둔다. 일부만 맞은 partial, 틀린 incorrect, 질문에 답하지 않은 not_answered는 모두 questionResolution을 continue로 둔다.
continue일 때는 같은 학습 목표를 더 쉽게 묻는 보조 질문 한 문장으로 question을 바꾼다. 자료에서 확인할 표현을 짧게 인용하거나 두 선택지 중 하나를 고르게 하는 등 묻는 지점을 분명히 한다. 이 보조 질문은 핵심 질문 수에 포함하지 않는다.`
    : `학생 답에 핵심 판단이나 관련 근거가 일부라도 알맞으면 answerStatus를 partial로 두고, 같은 내용을 표현만 바꾸어 다시 묻지 말고 questionResolution을 advance로 두어 아직 확인하지 않은 다음 학습 질문으로 이동하라.
현재 질문의 핵심 판단이 틀렸거나 질문에 답하지 않은 경우에만 incorrect 또는 not_answered로 두고 questionResolution을 continue로 둔다. 이때 question에는 현재 질문 문구를 그대로 유지하고, 더 작은 단서는 studentMessage에만 제시하라.`}
현재 질문에서 앞서 해결되지 않은 답이 두 번 있었고 이번 답도 ${boundedQuestionFlow ? "partial, incorrect, not_answered 중 하나" : "incorrect 또는 not_answered"}이면, 현재 질문의 답만 resolvedQuestionAnswer에 직접 알려 주고 questionResolution을 reveal_and_advance로 둔 뒤 아직 확인하지 않은 다음 질문으로 이동하라. 활동 전체를 끝내지 마라.
답을 충분히 확인해 다음 학습 질문으로 넘어가면 questionResolution을 advance로 둔다. 활동 완료 기준 전체를 충족했을 때만 complete로 둔다.
내부 진단을 확정적 평가처럼 말하지 말라.
`;

  const result = await client.responses.create({
    model,
    instructions: `${SYSTEM_PROMPT}\n프롬프트 버전: ${PROMPT_VERSION}`,
    input,
    store: false,
    safety_identifier: safetyIdentifier,
    prompt_cache_key: PROMPT_VERSION,
    max_output_tokens: 420,
    reasoning: { effort: "none" },
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "writing_tutor_response",
        strict: true,
        schema: agentResponseJsonSchema
      }
    }
  });

  const parsed = agentResponseSchema.parse(JSON.parse(result.output_text));
  return {
    response: applyTutorResponsePolicy(request, parsed),
    usage: {
      input: result.usage?.input_tokens ?? 0,
      output: result.usage?.output_tokens ?? 0
    },
    model
  };
}
