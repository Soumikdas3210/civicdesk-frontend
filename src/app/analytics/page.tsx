"use client";

import dynamic from "next/dynamic";
import OfficerTable from "@/components/analytics/OfficerTable";
import SlaBreachTable from "@/components/analytics/SlaBreachTable";
import SummaryCards from "@/components/analytics/SummaryCards";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import {
  useNameTotals,
  useOfficerStats,
  useOverview,
  useSlaBreaches,
} from "@/hooks/useAnalytics";

const AnalyticsBarChart = dynamic(
  () => import("@/components/analytics/AnalyticsBarChart"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-card border border-n-200 bg-surface p-5">
        <Spinner label="Loading chart" />
      </div>
    ),
  },
);

export default function AnalyticsPage() {
  const overview = useOverview();
  const officers = useOfficerStats();
  const departments = useNameTotals("departments");
  const categories = useNameTotals("categories");
  const wards = useNameTotals("wards");
  const sla = useSlaBreaches();

  const pageEmpty = overview.data?.total === 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Complaint volume, resolution time and SLA breaches across every complaint."
      />

      {pageEmpty ? (
        <EmptyState
          title="No complaints yet"
          description="Charts and tables will appear here once complaints have been filed."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <SummaryCards q={overview} />

          <div className="grid gap-6 lg:grid-cols-2">
            <AnalyticsBarChart title="Complaints by department" q={departments} />
            <AnalyticsBarChart title="Complaints by ward" q={wards} />
          </div>

          <AnalyticsBarChart title="Complaints by category" q={categories} />

          <OfficerTable q={officers} />

          <SlaBreachTable q={sla} />
        </div>
      )}
    </>
  );
}
