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
  const input = `
활동: ${request.activity}
요청 유형: ${request.supportMode === "hint" ? "AI 힌트 요청" : "도움 없이 답 제출"}
현재 비계 단계: ${request.scaffoldLevel}
현재 상호작용: ${request.attemptCount + 1}회째
최근 대화:\n${history || "없음"}
학생 입력:\n${request.message}

${request.supportMode === "hint"
    ? "정답이나 완성 문장을 주지 말고 현재 단계에 맞는 질문 또는 단서 하나만 제공하라."
    : "학생이 AI 도움 없이 낸 답을 먼저 진단하고, 정오 판단의 근거를 묻는 다음 행동 하나만 요청하라."}
현재 답만 보지 말고 최근 대화에 있는 학생의 앞 답과 현재 답을 합쳐 활동 완료 기준 충족 여부를 판정하라.
현재 상호작용이 3회째 이상이면 새 꼬리질문을 만들기 전에 누적 답을 최종 판정하라. 누적 답이 기준을 충족하면 answerStatus를 met, activityComplete를 true로 두고 반드시 끝내라. 횟수만으로 미해결이라고 판정하지 마라.
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
