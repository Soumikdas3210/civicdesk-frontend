"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md";
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const base = useId();
  const titleId = `${base}-title`;
  const descriptionId = description ? `${base}-description` : undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-card border border-n-200 bg-surface p-0 text-n-900 shadow-xl backdrop:bg-n-900/50",
        size === "sm" ? "max-w-md" : "max-w-xl",
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-n-200 p-5">
        <div>
          <h2 id={titleId} className="text-card-title">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-secondary text-n-500">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-ctl text-n-500 transition-colors duration-150 hover:bg-n-100"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      {children && <div className="p-5">{children}</div>}

      {footer && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-n-200 bg-n-50 p-5">
          {footer}
        </div>
      )}
    </dialog>
  );
}