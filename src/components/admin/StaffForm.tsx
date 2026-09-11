"use client";

import { useState, type FormEvent } from "react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { zodFieldErrors } from "@/lib/errors";
import { staffSchema, type StaffInput } from "@/lib/schemas/staff";

export type StaffFormValues = {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  role: string;
};

const EMPTY: StaffFormValues = {
  email: "",
  fullName: "",
  phone: "",
  password: "",
  role: "",
};

type StaffFormProps = {
  formId: string;
  serverError: string | null;
  onValidSubmit: (values: StaffInput) => void;
};

export default function StaffForm({
  formId,
  serverError,
  onValidSubmit,
}: StaffFormProps) {
  const [values, setValues] = useState<StaffFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof StaffFormValues, value: string) {
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
    const parsed = staffSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onValidSubmit(parsed.data);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <Field label="Full name" error={errors.fullName} required>
        <Input
          value={values.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          placeholder="Rahim Officer"
        />
      </Field>

      <Field label="Email" error={errors.email} required>
        <Input
          type="email"
          autoComplete="off"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="rahim@city.gov"
        />
      </Field>

      <Field label="Phone" help="Optional." error={errors.phone}>
        <Input
          value={values.phone}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="01700000000"
        />
      </Field>

      <Field
        label="Temporary password"
        help="At least 8 characters. The person can change it after signing in."
        error={errors.password}
        required
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
        />
      </Field>

      <Field label="Role" error={errors.role} required>
        <Select
          value={values.role}
          onChange={(event) => update("role", event.target.value)}
        >
          <option value="">Choose a role</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>

      <p className="mb-6 text-secondary text-n-500">
        New officers get their department and wards from the Manage panel after
        they are created.
      </p>

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
