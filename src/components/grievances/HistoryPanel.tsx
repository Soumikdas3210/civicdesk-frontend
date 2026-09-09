"use client";

import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { useHistory } from "@/hooks/useGrievanceActions";
import { STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types";

const ACTION_TEXT: Record<string, string> = {
  CREATED: "Complaint submitted",
  STATUS_CHANGED: "Status changed",
  ASSIGNED: "Assigned to an officer",
  UNASSIGNED_INELIGIBLE: "Unassigned automatically",
  RECATEGORIZED: "Moved to a different category",
  ESCALATED: "Priority escalated",
  RULE_APPLIED: "An escalation rule ran",
  BREACH_FLAGGED: "Passed its deadline",
  RATING_RETRACTED: "Rating removed",
};

function line(entry: AuditLogEntry): string {
  const base = ACTION_TEXT[entry.action] ?? entry.action;
  if (entry.action === "STATUS_CHANGED" && entry.fromStatus && entry.toStatus) {
    return `${STATUS_LABEL[entry.fromStatus]} to ${STATUS_LABEL[entry.toStatus]}`;
  }
  return base;
}

export default function HistoryPanel({
  grievanceId,
  enabled,
}: {
  grievanceId: string;
  enabled: boolean;
}) {
  const query = useHistory(grievanceId, enabled);

  return (
    <Card>
      <h3 className="mb-3 text-meta text-n-500">History</h3>

      {query.isLoading && <Spinner size="sm" />}

      {query.data && query.data.length === 0 && (
        <p className="text-secondary text-n-500">Nothing recorded yet.</p>
      )}

      {query.data && query.data.length > 0 && (
        <ol className="flex flex-col gap-3">
          {query.data.map((entry) => (
            <li key={entry.id} className="border-l-2 border-n-200 pl-3">
              <p className="text-secondary font-semibold">{line(entry)}</p>
              <p className="text-meta font-normal text-n-500">
                {formatDateTime(entry.createdAt)}
                {entry.actorId === null && (
                  <span aria-hidden="true"> · automatic</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}