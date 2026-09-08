import { z } from "zod";

export const wardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter a ward name.")
    .max(120, "Please keep the ward name under 120 characters."),
  code: z
    .string()
    .trim()
    .min(1, "Please enter a ward code.")
    .max(40, "Please keep the ward code under 40 characters."),
});

export type WardInput = z.infer<typeof wardSchema>;
