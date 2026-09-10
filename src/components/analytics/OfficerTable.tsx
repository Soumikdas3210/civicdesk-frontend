"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import Panel from "./Panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import type { OfficerStat } from "@/lib/types";

function oneDp(value: string | null) {
  return value == null ? "-" : Number(value).toFixed(1);
}

export default function OfficerTable({
  q,
}: {
  q: UseQueryResult<OfficerStat[]>;
}) {
  const rows = q.data ?? [];

  return (
    <Panel
      title="Officer performance"
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => void q.refetch()}
      isEmpty={rows.length === 0}
      emptyText="No officers yet."
    >
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH className="text-right">Assigned</TH>
            <TH className="text-right">Resolved</TH>
            <TH className="text-right">Avg resolution (h)</TH>
            <TH className="text-right">Avg rating</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((officer) => (
            <TR key={officer.id}>
              <TD className="font-semibold text-n-900">{officer.fullName}</TD>
              <TD className="text-right tabular-nums">
                {Number(officer.assigned ?? 0)}
              </TD>
              <TD className="text-right tabular-nums">
                {Number(officer.resolved ?? 0)}
              </TD>
              <TD className="text-right tabular-nums">
                {oneDp(officer.avgResolutionHours)}
              </TD>
              <TD className="text-right tabular-nums">
                {oneDp(officer.avgCsat)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Panel>
  );
}
