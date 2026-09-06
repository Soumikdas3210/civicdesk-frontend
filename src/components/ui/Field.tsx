"use client";

import { createContext, useContext, useId } from "react";

type FieldControl = {
  id: string | undefined;
  describedBy: string | undefined;
  invalid: boolean;
};

const FieldContext = createContext<FieldControl | null>(null);

export function useFieldControl(): FieldControl {
  return (
    useContext(FieldContext) ?? {
      id: undefined,
      describedBy: undefined,
      invalid: false,
    }
  );
}

type FieldProps = {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export default function Field({
  label,
  help,
  error,
  required = false,
  children,
}: FieldProps) {
  const base = useId();
  const id = `${base}-control`;
  const helpId = help ? `${base}-help` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="mb-6">
      <label htmlFor={id} className="mb-1 block text-secondary font-semibold">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {help && (
        <p id={helpId} className="mb-2 text-secondary text-n-500">
          {help}
        </p>
      )}

      <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldContext.Provider>

      {error && (
        <p
          id={errorId}
          className="mt-2 flex items-start gap-2 text-secondary font-semibold text-danger"
        >
          <span aria-hidden="true">!</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}