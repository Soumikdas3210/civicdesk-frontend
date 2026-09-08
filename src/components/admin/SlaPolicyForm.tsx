"use client";

import { useState, type FormEvent } from "react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/constants";
import { zodFieldErrors } from "@/lib/errors";
import { slaPolicySchema, type SlaPolicyInput } from "@/lib/schemas/slaPolicy";

export type SlaPolicyFormValues = {
  categoryId: string;
  priority: string;
  responseDueHours: string;
  resolutionDueHours: string;
};

export type CategoryOption = { id: string; label: string };

type SlaPolicyFormProps = {
  formId: string;
  initial: SlaPolicyFormValues;
  categoryOptions: CategoryOption[];
  categoriesLoading: boolean;
  serverError: string | null;
  onValidSubmit: (values: SlaPolicyInput) => void;
};

/**
 * Remount this with a `key` (policy id, or "create") to reset it.
 * That keeps the reset logic out of an effect.
 */
export default function SlaPolicyForm({
  formId,
  initial,
  categoryOptions,
  categoriesLoading,
  serverError,
  onValidSubmit,
}: SlaPolicyFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof SlaPolicyFormValues, value: string) {
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
    const parsed = slaPolicySchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onValidSubmit(parsed.data);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <Field label="Category" error={errors.categoryId} required>
        <Select
          value={values.categoryId}
          onChange={(event) => update("categoryId", event.target.value)}
          disabled={categoriesLoading}
        >
          <option value="">Choose a category</option>
          {categoryOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Priority" error={errors.priority} required>
        <Select
          value={values.priority}
          onChange={(event) => update("priority", event.target.value)}
        >
          <option value="">Choose a priority</option>
          {PRIORITY_ORDER.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Response time (hours)"
        help="How long an officer has to make first contact."
        error={errors.responseDueHours}
        required
      >
        <Input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={values.responseDueHours}
          onChange={(event) => update("responseDueHours", event.target.value)}
          placeholder="4"
        />
      </Field>

      <Field
        label="Resolution time (hours)"
        help="How long to fully resolve the complaint."
        error={errors.resolutionDueHours}
        required
      >
        <Input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={values.resolutionDueHours}
          onChange={(event) => update("resolutionDueHours", event.target.value)}
          placeholder="24"
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
