import { cn } from "@/lib/cn";

export default function TrackingCode({
  code,
  size = "sm",
  className,
}: {
  code: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-dashed border-primary-200 bg-primary-50 font-mono font-bold text-primary-700",
        size === "sm"
          ? "px-2 py-0.5 text-meta tracking-[0.09em]"
          : "border-2 px-5 py-3 text-2xl tracking-[0.14em]",
        className,
      )}
    >
      {code}
    </span>
  );
}