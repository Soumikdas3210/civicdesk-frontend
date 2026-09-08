"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/constants";
import type { AnalyticsOverview } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-n-200 bg-n-50 p-4">
      <p className="text-meta text-n-500">{label}</p>
      <p className="mt-1 text-section-title tabular-nums text-n-900">{value}</p>
    </div>
  );
}

export default function SummaryCards({
  q,
}: {
  q: UseQueryResult<AnalyticsOverview>;
}) {
  if (q.isLoading) return <Spinner label="Loading overview" />;

  if (q.isError || !q.data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-secondary text-n-500">Could not load the overview.</p>
        <Button variant="secondary" onClick={() => void q.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const d = q.data;
  const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <Stat label="Total complaints" value={String(d.total)} />
      {STATUS_ORDER.map((status) => (
        <Stat
          key={status}
          label={STATUS_LABEL[status]}
          value={String(d.byStatus[status] ?? 0)}
        />
      ))}
      <Stat label="Response breach rate" value={pct(d.responseBreachRate)} />
      <Stat label="Resolution breach rate" value={pct(d.resolutionBreachRate)} />
    </div>
  );
}
