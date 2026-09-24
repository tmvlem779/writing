import { z } from "zod";

export const passwordUpdateSchema = z.object({
  password: z.string().min(8).max(128)
});
