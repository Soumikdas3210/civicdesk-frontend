import { z } from "zod";

export const staffSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter an email address.")
    .email("That does not look like an email address."),
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter the person's full name.")
    .max(120, "Please keep the name under 120 characters."),
  phone: z
    .string()
    .trim()
    .max(20, "That phone number looks too long.")
    .optional(),
  password: z
    .string()
    .min(8, "Please use at least 8 characters so the account stays secure."),
  role: z.enum(["officer", "admin"], { error: "Please choose a role." }),
});

export type StaffInput = z.infer<typeof staffSchema>;
