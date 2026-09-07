import { dueText, formatDate } from "@/lib/format";
import type { Grievance } from "@/lib/types";

export default function DeadlineBadge({ grievance }: { grievance: Grievance }) {
  if (grievance.status === "RESOLVED" || grievance.status === "CLOSED") {
    return (
      <span className="text-secondary text-n-500">
        {grievance.resolvedAt
          ? `Resolved ${formatDate(grievance.resolvedAt)}`
          : `Closed ${formatDate(grievance.updatedAt)}`}
      </span>
    );
  }

  if (grievance.resolutionBreached) {
    return (
      <span className="text-secondary font-semibold text-danger">
        Past the deadline
      </span>
    );
  }

  if (grievance.status === "WAITING_ON_CITIZEN") {
    return (
      <span className="text-secondary text-n-500">Waiting for a reply</span>
    );
  }

  return (
    <span className="text-secondary text-n-500">
      {dueText(grievance.resolutionDueAt)}
    </span>
  );
}