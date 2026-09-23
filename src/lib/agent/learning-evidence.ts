import type { Activity, AgentResponse } from "./schema";

export type LearningEvidence = {
  conceptCode: Activity;
  scaffoldLevel: number;
  independentSuccess: boolean;
  eventType: "attempt" | "independent_success" | "scaffolded_success";
};

export function deriveLearningEvidence(activity: Activity, response: AgentResponse): LearningEvidence {
  const hasMasteryEvidence = response.masteryEvidence.length > 0;
  const independentSuccess = hasMasteryEvidence && response.scaffoldLevel === 0;

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
