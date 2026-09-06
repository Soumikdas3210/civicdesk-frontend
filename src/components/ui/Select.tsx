"use client";

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";
import { CONTROL_BASE, controlBorder } from "./Input";

export default function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const { id, describedBy, invalid } = useFieldControl();

  return (
    <div className="relative">
      <select
        id={rest.id ?? id}
        aria-describedby={rest["aria-describedby"] ?? describedBy}
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL_BASE,
          controlBorder(invalid),
          "appearance-none pr-10",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-n-400"
        aria-hidden="true"
      />
    </div>
  );
}