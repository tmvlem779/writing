import { z } from "zod";

export const primaryActivityAnswersSchema = z.record(
  z.string().regex(/^[a-z0-9-]+$/).max(100),
  z.string().trim().min(1).max(4000)
);

export function rememberPrimaryActivityAnswer(
  answers: Readonly<Record<string, string>>,
  activityId: string,
  submission: string
) {
  const primaryAnswer = submission.trim();
  if (!primaryAnswer || answers[activityId]?.trim()) return answers;
  return { ...answers, [activityId]: primaryAnswer };
}
