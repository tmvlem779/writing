import OpenAI from "openai";
import { agentResponseJsonSchema, agentResponseSchema, type AgentResponse, type TurnRequest } from "./schema";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./system-prompt";

export async function runOpenAiAgent(
  client: OpenAI,
  request: TurnRequest,
  safetyIdentifier: string
): Promise<{ response: AgentResponse; usage: { input: number; output: number }; model: string }> {
  const model = process.env.OPENAI_MODEL ?? "gpt-6-luna";
  const history = request.history.map((item) => `${item.role === "student" ? "학생" : "튜터"}: ${item.content}`).join("\n");
  const input = `
활동: ${request.activity}
현재 비계 단계: ${request.scaffoldLevel}
현재 시도 횟수: ${request.attemptCount}
최근 대화:\n${history || "없음"}
학생 입력:\n${request.message}

내부 진단을 확정적 평가처럼 말하지 말고, 학생에게 한 가지 다음 행동만 요청하라.
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
