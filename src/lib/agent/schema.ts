import { z } from "zod";

export const activitySchema = z.enum([
  "diagnose",
  "create",
  "expand",
  "compare",
  "error",
  "transfer",
  "reflect",
  "authentic"
]);

export const turnRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  activity: activitySchema,
  message: z.string().trim().min(1).max(4000),
  supportMode: z.enum(["submit", "hint"]).default("submit"),
  scaffoldLevel: z.number().int().min(0).max(4).default(0),
  attemptCount: z.number().int().min(0).max(20).default(0),
  history: z
    .array(
      z.object({
        role: z.enum(["student", "assistant"]),
        content: z.string().max(2000)
      })
    )
    .max(8)
    .default([])
});

export const agentResponseSchema = z.object({
  mode: z.enum(["diagnose", "question", "hint", "compare", "revise", "model", "reflect"]),
  answerStatus: z.enum(["not_answered", "incorrect", "partial", "met"]),
  scaffoldLevel: z.number().int().min(0).max(4),
  studentMessage: z.string().min(1).max(360),
  question: z.string().max(180),
  focusConcepts: z.array(z.string().max(80)).max(3),
  observations: z.array(z.string().max(180)).max(2),
  nextAction: z.enum(["rewrite", "explain", "compare", "expand", "transfer", "complete"]),
  activityComplete: z.boolean(),
  masteryEvidence: z.array(z.string().max(180)).max(2),
  safety: z.object({
    blocked: z.boolean(),
    reason: z.string().max(240).nullable()
  })
});

export type Activity = z.infer<typeof activitySchema>;
export type TurnRequest = z.infer<typeof turnRequestSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;

export const agentResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "mode",
    "answerStatus",
    "scaffoldLevel",
    "studentMessage",
    "question",
    "focusConcepts",
    "observations",
    "nextAction",
    "activityComplete",
    "masteryEvidence",
    "safety"
  ],
  properties: {
    mode: { type: "string", enum: ["diagnose", "question", "hint", "compare", "revise", "model", "reflect"] },
    answerStatus: { type: "string", enum: ["not_answered", "incorrect", "partial", "met"] },
    scaffoldLevel: { type: "integer", minimum: 0, maximum: 4 },
    studentMessage: { type: "string", maxLength: 360 },
    question: { type: "string", maxLength: 180 },
    focusConcepts: { type: "array", maxItems: 3, items: { type: "string", maxLength: 80 } },
    observations: { type: "array", maxItems: 2, items: { type: "string", maxLength: 180 } },
    nextAction: { type: "string", enum: ["rewrite", "explain", "compare", "expand", "transfer", "complete"] },
    activityComplete: { type: "boolean" },
    masteryEvidence: { type: "array", maxItems: 2, items: { type: "string", maxLength: 180 } },
    safety: {
      type: "object",
      additionalProperties: false,
      required: ["blocked", "reason"],
      properties: {
        blocked: { type: "boolean" },
        reason: { type: ["string", "null"] }
      }
    }
  }
} as const;
