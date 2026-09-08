import { cn } from "@/lib/cn";
import { TIMELINE_INDEX, TIMELINE_STEPS } from "@/lib/constants";
import type { GrievanceStatus } from "@/lib/constants";

export default function StatusTimeline({
  status,
}: {
  status: GrievanceStatus;
}) {
  const current = TIMELINE_INDEX[status];

  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Progress">
      {TIMELINE_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 text-secondary",
                active && "font-semibold text-primary-700",
                done && "text-n-500",
                !active && !done && "text-n-300",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "size-3 shrink-0 rounded-full",
                  active && "bg-primary-600 ring-4 ring-primary-100",
                  done && "bg-primary-300",
                  !active && !done && "bg-n-200",
                )}
                aria-hidden="true"
              />
              {step}
            </span>
            {index < TIMELINE_STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 shrink-0",
                  index < current ? "bg-primary-300" : "bg-n-200",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}