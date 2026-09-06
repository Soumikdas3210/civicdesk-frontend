"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";
import { CONTROL_BASE, controlBorder } from "./Input";

export default function Textarea({
  className,
  rows = 5,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, describedBy, invalid } = useFieldControl();

  return (
    <textarea
      id={rest.id ?? id}
      rows={rows}
      aria-describedby={rest["aria-describedby"] ?? describedBy}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        controlBorder(invalid),
        "min-h-30 resize-y leading-relaxed",
        className,
      )}
      {...rest}
    />
  );
}