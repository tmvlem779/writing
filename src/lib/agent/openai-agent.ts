import OpenAI from "openai";
import { resolveOpenAiModel } from "./model";
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
현재 시도 횟수: ${request.attemptCount}
최근 대화:\n${history || "없음"}
학생 입력:\n${request.message}

${request.supportMode === "hint"
    ? "정답이나 완성 문장을 주지 말고 현재 단계에 맞는 질문 또는 단서 하나만 제공하라."
    : "학생이 AI 도움 없이 낸 답을 먼저 진단하고, 정오 판단의 근거를 묻는 다음 행동 하나만 요청하라."}
내부 진단을 확정적 평가처럼 말하지 말라.
`;

  const result = await client.responses.create({
    model,
    instructions: `${SYSTEM_PROMPT}\n프롬프트 버전: ${PROMPT_VERSION}`,
    input,
    store: false,
    safety_identifier: safetyIdentifier,
    max_output_tokens: 700,
    reasoning: { effort: "none" },
    text: {
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
    response: parsed,
    usage: {
      input: result.usage?.input_tokens ?? 0,
      output: result.usage?.output_tokens ?? 0
    },
    model
  };
}
