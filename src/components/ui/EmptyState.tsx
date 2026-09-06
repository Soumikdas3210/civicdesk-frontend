import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-n-200 bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-n-100 text-2xl text-n-500"
        aria-hidden="true"
      >
        +
      </div>
      <h3 className="text-card-title">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[44ch] text-secondary text-n-500">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}