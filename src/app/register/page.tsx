"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { signUp } from "@/lib/auth";
import { errorMessage, fieldErrors, zodFieldErrors } from "@/lib/errors";
import { registerSchema } from "@/lib/schemas/auth";

type FormKey = "fullName" | "email" | "phone" | "password";

export default function RegisterPage() {
  const router = useRouter();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: FormKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit() {
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await signUp(parsed.data);
      router.replace(
        `/login?registered=1&email=${encodeURIComponent(parsed.data.email)}`,
      );
    } catch (error) {
      const fields = fieldErrors(error);
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create an account"
      description="You will be able to report problems in your area and follow them until they are fixed."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-600 underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        noValidate
      >
        <Field label="Full name" error={errors.fullName} required>
          <Input
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </Field>

        <Field label="Email" error={errors.email} required>
          <Input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>

        <Field
          label="Phone number"
          help="We use this to contact you about your complaints."
          error={errors.phone}
          required
        >
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>

        <Field
          label="Password"
          help="At least 8 characters."
          error={errors.password}
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-ctl border border-danger bg-danger-tint p-3 text-secondary font-semibold text-danger"
          >
            <span aria-hidden="true">!</span>
            <span>{formError}</span>
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}