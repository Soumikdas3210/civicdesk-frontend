import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("That does not look like an email address."),
  password: z.string().min(1, "Please enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("That does not look like an email address."),
  phone: z
    .string()
    .trim()
    .min(11, "Please enter your phone number.")
    .max(15, "That phone number looks too long."),
  password: z
    .string()
    .min(8, "Please use at least 8 characters so your account stays secure."),
});

export type RegisterInput = z.infer<typeof registerSchema>;