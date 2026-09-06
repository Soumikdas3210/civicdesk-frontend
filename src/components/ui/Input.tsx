"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";

export const CONTROL_BASE =
  "w-full min-h-11 rounded-ctl border bg-surface px-3 py-2 text-body text-n-900 placeholder:text-n-300 transition-colors duration-150 focus:border-primary-400 disabled:bg-n-100 disabled:text-n-300";

export function controlBorder(invalid: boolean): string {
  return invalid ? "border-2 border-danger" : "border-n-200";
}

export default function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const { id, describedBy, invalid } = useFieldControl();

  return (
    <input
      id={rest.id ?? id}
      aria-describedby={rest["aria-describedby"] ?? describedBy}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, controlBorder(invalid), className)}
      {...rest}
    />
  );
}