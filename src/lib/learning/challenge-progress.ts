import { z } from "zod";

export const challengeChapterSchema = z.enum(["concept", "practice", "real-life"]);

export const challengeProgressInputSchema = z.object({
  trackId: z.enum(["structure", "grammar"]),
  lessonNumber: z.number().int().min(1).max(6),
  conceptCompleted: z.boolean(),
  completedActivityIds: z.array(z.string().regex(/^[a-z0-9-]+$/).max(100)).max(12),
  lastChapter: challengeChapterSchema,
  lastActivityId: z.string().regex(/^[a-z0-9-]+$/).max(100).nullable()
});

export type ChallengeProgressInput = z.infer<typeof challengeProgressInputSchema>;

export type ChallengeProgressRecord = ChallengeProgressInput & {
  updatedAt: string;
};
