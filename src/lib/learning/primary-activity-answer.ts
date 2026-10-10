export function rememberPrimaryActivityAnswer(
  answers: Readonly<Record<string, string>>,
  activityId: string,
  submission: string
) {
  const primaryAnswer = submission.trim();
  if (!primaryAnswer || answers[activityId]?.trim()) return answers;
  return { ...answers, [activityId]: primaryAnswer };
}
