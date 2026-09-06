import { cn } from "@/lib/cn";

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
};

export default function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-card border border-n-200 bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-danger-tint text-2xl text-danger"
        aria-hidden="true"
      >
        !
      </div>
      <h3 className="text-card-title">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[44ch] text-secondary text-n-500">
        {message}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}