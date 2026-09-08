import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter a category name of at least 2 characters.")
    .max(120, "Please keep the category name under 120 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Please keep the description under 500 characters.")
    .optional(),
  departmentId: z.string().min(1, "Please choose a department."),
});

export type CategoryInput = z.infer<typeof categorySchema>;
