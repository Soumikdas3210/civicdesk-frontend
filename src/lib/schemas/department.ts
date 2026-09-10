import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter a department name of at least 2 characters.")
    .max(120, "Please keep the department name under 120 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Please keep the description under 500 characters.")
    .optional(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
