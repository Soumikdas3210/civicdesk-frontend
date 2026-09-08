"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help?: string;
  disabled?: boolean;
  className?: string;
};

export default function Checkbox({
  checked,
  onChange,
  label,
  help,
  disabled = false,
  className,
}: CheckboxProps) {
  const base = useId();
  const helpId = help ? `${base}-help` : undefined;

  return (
    <div className={cn("flex flex-col", className)}>
      <label
        className={cn(
          "flex min-h-11 items-center gap-2.5 text-body",
          disabled ? "cursor-not-allowed text-n-300" : "cursor-pointer text-n-900",
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.checked)}
          className="size-5 shrink-0 rounded-ctl border-n-200 accent-primary-500 disabled:opacity-50"
        />
        <span>{label}</span>
      </label>
      {help && (
        <p id={helpId} className="mt-1 text-secondary text-n-500">
          {help}
        </p>
      )}
    </div>
  );
}
