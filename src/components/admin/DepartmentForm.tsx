"use client";

import { useState, type FormEvent } from "react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { zodFieldErrors } from "@/lib/errors";
import { departmentSchema } from "@/lib/schemas/department";

export type DepartmentFormValues = { name: string; description: string };

type DepartmentFormProps = {
  formId: string;
  initial: DepartmentFormValues;
  serverError: string | null;
  onValidSubmit: (values: { name: string; description: string }) => void;
};

export default function DepartmentForm({
  formId,
  initial,
  serverError,
  onValidSubmit,
}: DepartmentFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof DepartmentFormValues, value: string) {
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
    const parsed = departmentSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onValidSubmit({
      name: parsed.data.name,
      description: (parsed.data.description ?? "").trim(),
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <Field label="Name" error={errors.name} required>
        <Input
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Water Board"
        />
      </Field>

      <Field
        label="Description"
        help="Optional. A short note about what this department handles."
        error={errors.description}
      >
        <Textarea
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Handles water supply, pipe leaks and drainage."
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
