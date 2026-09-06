"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import Spinner from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
};

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ctl border border-transparent px-5 text-body font-semibold transition-colors duration-150 disabled:cursor-not-allowed";

const VARIANTS = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-200",
  secondary:
    "border-n-200 bg-surface text-primary-600 hover:border-primary-300 hover:bg-primary-50 disabled:border-n-200 disabled:bg-n-100 disabled:text-n-300",
  danger:
    "bg-danger text-white hover:bg-danger-700 disabled:bg-n-100 disabled:text-n-300",
  ghost:
    "bg-transparent text-primary-600 hover:bg-primary-50 disabled:text-n-300",
} as const;

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], className)}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}