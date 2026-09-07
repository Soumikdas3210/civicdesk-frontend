import { z } from "zod";

export const createGrievanceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Please make the title at least 5 characters so officers can find it.")
    .max(120, "Please keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(
      20,
      "Please describe what is wrong, where it is, and how long it has been like that.",
    ),
  categoryId: z.string().uuid("Please choose a category."),
  wardId: z.string().uuid("Please choose the ward where the problem is."),
});

export type CreateGrievanceInput = z.infer<typeof createGrievanceSchema>;