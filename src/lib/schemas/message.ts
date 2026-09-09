import { z } from "zod";

export const createMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Please write a message before sending.")
    .max(2000, "Please keep the message under 2000 characters."),
  isInternal: z.boolean().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;