import { z } from "zod";

function optionalId(message: string) {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().uuid(message).nullable(),
  );
}

export const cannedResponseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Please give the template a short, recognizable title.")
    .max(120, "Please keep the title under 120 characters."),
  body: z
    .string()
    .trim()
    .min(1, "Please write the text officers will send."),
  departmentId: optionalId("Please choose a valid department."),
  categoryId: optionalId("Please choose a valid category."),
});

export type CannedResponseInput = z.infer<typeof cannedResponseSchema>;
