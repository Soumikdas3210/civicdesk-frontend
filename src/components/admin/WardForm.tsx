"use client";

import { useState, type FormEvent } from "react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { zodFieldErrors } from "@/lib/errors";
import { wardSchema } from "@/lib/schemas/ward";

export type WardFormValues = { name: string; code: string };

type WardFormProps = {
  formId: string;
  initial: WardFormValues;
  serverError: string | null;
  onValidSubmit: (values: { name: string; code: string }) => void;
};

/**
 * Remount this with a `key` (ward id, or "create") to reset it.
 * That keeps the reset logic out of an effect.
 */
export default function WardForm({
  formId,
  initial,
  serverError,
  onValidSubmit,
}: WardFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof WardFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = wardSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onValidSubmit({ name: parsed.data.name, code: parsed.data.code });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <Field label="Name" error={errors.name} required>
        <Input
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Ward 12"
        />
      </Field>

      <Field
        label="Code"
        help="A short reference, for example W12. Must be unique."
        error={errors.code}
        required
      >
        <Input
          value={values.code}
          onChange={(event) => update("code", event.target.value)}
          placeholder="W12"
        />
      </Field>

      {serverError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-ctl border border-danger bg-danger-tint p-3 text-secondary font-semibold text-danger"
        >
          <span aria-hidden="true">!</span>
          <span>{serverError}</span>
        </p>
      )}
    </form>
  );
}
