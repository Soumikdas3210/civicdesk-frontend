import { z } from "zod";

export const changeStatusSchema = z.object({
  action: z.enum([
    "START",
    "REQUEST_INFO",
    "CITIZEN_REPLY",
    "RESOLVE",
    "CLOSE",
    "REOPEN",
    "RESUME",
  ]),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;