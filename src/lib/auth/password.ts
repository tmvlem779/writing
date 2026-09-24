import { z } from "zod";
import { meetsPasswordRequirements, PASSWORD_REQUIREMENTS_MESSAGE } from "./password-policy.ts";

export const passwordUpdateSchema = z.object({
  password: z.string().refine(meetsPasswordRequirements, PASSWORD_REQUIREMENTS_MESSAGE)
});
