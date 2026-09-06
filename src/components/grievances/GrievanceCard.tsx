import Link from "next/link";
import DeadlineBadge from "./DeadlineBadge";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import TrackingCode from "./TrackingCode";
import { STATUS_RAIL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/roles";
import type { Grievance } from "@/lib/types";

export default function GrievanceCard({
  grievance,
  role,
}: {
  grievance: Grievance;
  role: Role;
}) {
  return (
    <article className="flex overflow-hidden rounded-card border border-n-200 bg-surface transition-colors duration-150 hover:border-primary-300">
      <div
        className={`w-1 shrink-0 ${STATUS_RAIL[grievance.status]}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1 p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
          <TrackingCode code={grievance.trackingCode} />
          <StatusBadge status={grievance.status} role={role} />
        </div>

        <h3 className="mb-1.5 text-card-title">
          <Link
            href={`/grievances/${grievance.id}`}
            className="hover:text-primary-600 hover:underline"
          >
            {grievance.title}
          </Link>
        </h3>

        <p className="text-secondary text-n-500">
          {grievance.category.name}
          <span aria-hidden="true"> · </span>
          {grievance.ward.name}
          {grievance.category.department && (
            <>
              <span aria-hidden="true"> · </span>
              {grievance.category.department.name}
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <PriorityBadge priority={grievance.priority} />
          <span className="text-secondary text-n-500">
            Submitted {formatDate(grievance.createdAt)}
          </span>
          <span aria-hidden="true" className="text-n-300">
            ·
          </span>
          <DeadlineBadge grievance={grievance} />
        </div>
      </div>
    </article>
  );
}