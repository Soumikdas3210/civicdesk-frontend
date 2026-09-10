"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Panel from "./Panel";
import type { NameTotalStat } from "@/lib/types";

const RAMP = [
  "fill-primary-700",
  "fill-primary-600",
  "fill-primary-500",
  "fill-primary-400",
  "fill-primary-300",
];

type AnalyticsBarChartProps = {
  title: string;
  q: UseQueryResult<NameTotalStat[]>;
};

export default function AnalyticsBarChart({ title, q }: AnalyticsBarChartProps) {
  const data = (q.data ?? [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      total: Number(row.total ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  const hasData = data.some((row) => row.total > 0);

  return (
    <Panel
      title={title}
      isLoading={q.isLoading}
      isError={q.isError}
      onRetry={() => void q.refetch()}
      isEmpty={!hasData}
    >
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ className: "fill-n-500", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ className: "fill-n-900", fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="total" className="fill-primary-500" radius={[0, 4, 4, 0]}>
            {data.map((row, index) => (
              <Cell key={row.id} className={RAMP[index % RAMP.length]} />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              style={{ fontSize: 12, fill: "var(--color-n-900)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}
