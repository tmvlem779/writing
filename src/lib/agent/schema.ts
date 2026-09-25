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
  scaffoldLevel: z.number().int().min(0).max(4),
  studentMessage: z.string().min(1).max(1200),
  question: z.string().min(1).max(500),
  focusConcepts: z.array(z.string().max(80)).max(4),
  observations: z.array(z.string().max(240)).max(4),
  nextAction: z.enum(["rewrite", "explain", "compare", "expand", "transfer"]),
  masteryEvidence: z.array(z.string().max(240)).max(4),
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
    "scaffoldLevel",
    "studentMessage",
    "question",
    "focusConcepts",
    "observations",
    "nextAction",
    "masteryEvidence",
    "safety"
  ],
  properties: {
    mode: { type: "string", enum: ["diagnose", "question", "hint", "compare", "revise", "model", "reflect"] },
    scaffoldLevel: { type: "integer", minimum: 0, maximum: 4 },
    studentMessage: { type: "string" },
    question: { type: "string" },
    focusConcepts: { type: "array", items: { type: "string" } },
    observations: { type: "array", items: { type: "string" } },
    nextAction: { type: "string", enum: ["rewrite", "explain", "compare", "expand", "transfer"] },
    masteryEvidence: { type: "array", items: { type: "string" } },
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
