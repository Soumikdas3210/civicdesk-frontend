import { z } from "zod";

/**
 * Hours arrive from a number input as a string. Reject anything that is not a
 * plain whole number, then hand the rest of the schema a real number.
 */
function hoursField(thing: string) {
  return z
    .string()
    .trim()
    .min(1, `Please enter ${thing}.`)
    .regex(/^\d+$/, "Please enter a whole number of hours.")
    .transform(Number)
    .refine((n) => n >= 1, "Please enter 1 hour or more.")
    .refine((n) => n <= 8760, "Please enter one year (8760 hours) or fewer.");
}

export const slaPolicySchema = z
  .object({
    categoryId: z.string().uuid("Please choose a category."),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
      error: "Please choose a priority.",
    }),
    responseDueHours: hoursField("the response time in hours"),
    resolutionDueHours: hoursField("the resolution time in hours"),
  })
  .refine((v) => v.resolutionDueHours >= v.responseDueHours, {
    path: ["resolutionDueHours"],
    error: "Resolution hours must be at least the response hours.",
  });

export type SlaPolicyInput = z.infer<typeof slaPolicySchema>;
