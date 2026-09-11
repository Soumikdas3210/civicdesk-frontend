"use client";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

type PanelProps = {
  title: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
};

export default function Panel({
  title,
  isLoading,
  isError,
  onRetry,
  isEmpty = false,
  emptyText = "No data yet.",
  children,
}: PanelProps) {
  return (
    <section className="rounded-card border border-n-200 bg-surface p-5">
      <h3 className="text-card-title">{title}</h3>
      <div className="mt-4">
        {isLoading ? (
          <Spinner label="Loading" />
        ) : isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-secondary text-n-500">
              Could not load this section.
            </p>
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : isEmpty ? (
          <p className="text-secondary text-n-500">{emptyText}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
