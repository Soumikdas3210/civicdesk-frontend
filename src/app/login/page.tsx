"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import AuthCard from "@/components/auth/AuthCard";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { signIn } from "@/lib/auth";
import { errorMessage, fieldErrors, zodFieldErrors } from "@/lib/errors";
import { qk } from "@/lib/queryKeys";
import { loginSchema } from "@/lib/schemas/auth";
import axios from "axios";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const justRegistered = params.get("registered") === "1";

  const [values, setValues] = useState({
    email: params.get("email") ?? "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: "email" | "password", value: string) {
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

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await signIn(parsed.data);
      await queryClient.invalidateQueries({ queryKey: qk.me });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/grievances");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setFormError("Email or password is incorrect.");
      } else {
        const fields = fieldErrors(error);
        if (Object.keys(fields).length > 0) setErrors(fields);
        else setFormError(errorMessage(error));
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use the email you registered with."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary-600 underline">
            Create an account
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
        {justRegistered && (
          <p
            role="status"
            className="mb-4 rounded-ctl border border-resolved bg-resolved-tint p-3 text-secondary font-semibold text-resolved"
          >
            Your account is ready. Sign in to continue.
          </p>
        )}

        <Field label="Email" error={errors.email} required>
          <Input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>

        <Field label="Password" error={errors.password} required>
          <Input
            type="password"
            autoComplete="current-password"
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
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}