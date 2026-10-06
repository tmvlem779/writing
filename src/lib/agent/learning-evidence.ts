import type { Activity, AgentResponse, TurnRequest } from "./schema";

export type LearningEvidence = {
  conceptCode: Activity;
  scaffoldLevel: number;
  independentSuccess: boolean;
  eventType: "attempt" | "independent_success" | "scaffolded_success";
};

export function deriveLearningEvidence(
  activity: Activity,
  response: AgentResponse,
  supportMode: TurnRequest["supportMode"] = "submit"
): LearningEvidence {
  const hasMasteryEvidence = response.masteryEvidence.length > 0;
  const independentSuccess = hasMasteryEvidence && response.scaffoldLevel === 0 && supportMode === "submit";

  return {
    conceptCode: activity,
    scaffoldLevel: response.scaffoldLevel,
    independentSuccess,
    eventType: independentSuccess
      ? "independent_success"
      : hasMasteryEvidence
        ? "scaffolded_success"
        : "attempt"
  };
}
