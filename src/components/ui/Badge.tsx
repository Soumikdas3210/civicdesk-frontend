import { cn } from "@/lib/cn";

export type BadgeTone =
  | "open"
  | "progress"
  | "waiting"
  | "resolved"
  | "reopened"
  | "closed"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  open: "bg-open-tint text-open",
  progress: "bg-progress-tint text-progress",
  waiting: "bg-waiting-tint text-waiting",
  resolved: "bg-resolved-tint text-resolved",
  reopened: "bg-reopened-tint text-reopened",
  closed: "bg-closed-tint text-closed",
  danger: "bg-danger-tint text-danger",
};

type BadgeProps = {
  tone: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function Badge({
  tone,
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-meta",
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <i
          className="size-[7px] shrink-0 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}