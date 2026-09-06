import { cn } from "@/lib/cn";

type SpinnerProps = {
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export default function Spinner({ label, size = "md", className }: SpinnerProps) {
  const icon = (
    <svg
      className={cn("animate-spin", size === "sm" ? "size-4" : "size-6")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!label) {
    return (
      <span role="status" className={cn("inline-flex text-current", className)}>
        {icon}
        <span className="sr-only">Loading</span>
      </span>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-n-500",
        className,
      )}
    >
      {icon}
      <p className="text-secondary">{label}</p>
    </div>
  );
}