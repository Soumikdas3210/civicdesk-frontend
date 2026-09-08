"use client";

import { useState, type FormEvent } from "react";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { zodFieldErrors } from "@/lib/errors";
import { categorySchema } from "@/lib/schemas/category";
import type { Department } from "@/lib/types";

export type CategoryFormValues = {
  name: string;
  description: string;
  departmentId: string;
  isActive: boolean;
};

type CategoryFormProps = {
  formId: string;
  mode: "create" | "edit";
  initial: CategoryFormValues;
  departments: Department[];
  departmentsLoading: boolean;
  serverError: string | null;
  onValidSubmit: (values: CategoryFormValues) => void;
};

/**
 * Remount this with a `key` (category id, or "create") to reset it.
 * That keeps the reset logic out of an effect.
 */
export default function CategoryForm({
  formId,
  mode,
  initial,
  departments,
  departmentsLoading,
  serverError,
  onValidSubmit,
}: CategoryFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) {
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
    const parsed = categorySchema.safeParse({
      name: values.name,
      description: values.description,
      departmentId: values.departmentId,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onValidSubmit({
      name: parsed.data.name,
      description: (parsed.data.description ?? "").trim(),
      departmentId: parsed.data.departmentId,
      isActive: values.isActive,
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <Field label="Name" error={errors.name} required>
        <Input
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Water supply"
        />
      </Field>

      <Field label="Department" error={errors.departmentId} required>
        <Select
          value={values.departmentId}
          onChange={(event) => update("departmentId", event.target.value)}
          disabled={departmentsLoading}
        >
          <option value="">Choose a department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Description"
        help="Optional. A short note about what belongs in this category."
        error={errors.description}
      >
        <Textarea
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Pipe leaks, low pressure and supply outages."
        />
      </Field>

      {mode === "edit" && (
        <Checkbox
          checked={values.isActive}
          onChange={(checked) => update("isActive", checked)}
          label="Active"
          help="Retiring a category hides it from the report form but keeps existing complaints."
          className="mb-6"
        />
      )}

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
