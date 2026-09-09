"use client";

import { Fragment } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import Panel from "./Panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/constants";
import type { SlaBreachRow } from "@/lib/types";

function groupByDepartment(rows: SlaBreachRow[]) {
  const map = new Map<string, SlaBreachRow[]>();
  for (const row of rows) {
    const list = map.get(row.department) ?? [];
    list.push(row);
    map.set(row.department, list);
  }
  return [...map.entries()]
    .map(([department, list]) => ({
      department,
      rows: [...list].sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) -
          PRIORITY_ORDER.indexOf(b.priority),
      ),
    }))
    .sort((a, b) => a.department.localeCompare(b.department));
}

export default function SlaBreachTable({
  q,
}: {
  q: UseQueryResult<SlaBreachRow[]>;
}) {
  const rows = q.data ?? [];
  const groups = groupByDepartment(rows);

  return (
    <Panel
      title="SLA breaches by department and priority"
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => void q.refetch()}
      isEmpty={rows.length === 0}
      emptyText="No breach data yet."
    >
      <Table>
        <THead>
          <TR>
            <TH>Priority</TH>
            <TH className="text-right">Response breaches</TH>
            <TH className="text-right">Resolution breaches</TH>
            <TH className="text-right">Total</TH>
          </TR>
        </THead>
        <TBody>
          {groups.map((group) => (
            <Fragment key={group.department}>
              <TR className="bg-n-50">
                <TD colSpan={4} className="font-semibold text-n-700">
                  {group.department}
                </TD>
              </TR>
              {group.rows.map((row) => (
                <TR key={`${group.department}-${row.priority}`}>
                  <TD>{PRIORITY_LABEL[row.priority]}</TD>
                  <TD className="text-right tabular-nums">
                    {Number(row.responseBreaches ?? 0)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {Number(row.resolutionBreaches ?? 0)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {Number(row.total ?? 0)}
                  </TD>
                </TR>
              ))}
            </Fragment>
          ))}
        </TBody>
      </Table>
    </Panel>
  );
}
