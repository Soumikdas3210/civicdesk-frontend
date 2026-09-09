import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import type { Grievance } from "@/lib/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-n-200 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-meta text-n-500">{label}</dt>
      <dd className="text-right text-secondary text-n-900">{value}</dd>
    </div>
  );
}

export default function DetailsPanel({ grievance }: { grievance: Grievance }) {
  return (
    <Card>
      <h3 className="mb-2 text-meta text-n-500">Details</h3>
      <dl>
        <Row label="Category" value={grievance.category.name} />
        <Row
          label="Department"
          value={grievance.category.department?.name ?? "Not available"}
        />
        <Row label="Ward" value={grievance.ward.name} />
        <Row
          label="Officer"
          value={
            grievance.assignedOfficerId ? "Assigned" : "Not yet assigned"
          }
        />
        <Row label="Submitted" value={formatDate(grievance.createdAt)} />
        <Row
          label="First reply due"
          value={
            <span
              className={
                grievance.responseBreached && !grievance.firstRespondedAt
                  ? "font-semibold text-danger"
                  : undefined
              }
            >
              {formatDate(grievance.responseDueAt)}
            </span>
          }
        />
        <Row
          label="Resolution due"
          value={
            <span
              className={
                grievance.resolutionBreached && !grievance.resolvedAt
                  ? "font-semibold text-danger"
                  : undefined
              }
            >
              {formatDate(grievance.resolutionDueAt)}
            </span>
          }
        />
        {grievance.resolvedAt && (
          <Row label="Resolved" value={formatDate(grievance.resolvedAt)} />
        )}
      </dl>
    </Card>
  );
}