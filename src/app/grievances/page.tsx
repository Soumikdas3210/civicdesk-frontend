"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import GrievanceCard from "@/components/grievances/GrievanceCard";
import GrievanceFilters, {
  EMPTY_FILTERS,
  type Filters,
} from "@/components/grievances/GrievanceFilters";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PAGE_SIZE } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Grievance, Paginated } from "@/lib/types";

const HEADINGS = {
  citizen: {
    title: "My complaints",
    description: "Everything you have reported, newest first.",
  },
  officer: {
    title: "Work queue",
    description: "Complaints in your department and the wards you cover.",
  },
  admin: {
    title: "All complaints",
    description: "Every complaint across all departments and wards.",
  },
} as const;

function GrievanceList() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: user } = useCurrentUser();

  const filters: Filters = {
    status: params.get("status") ?? "",
    priority: params.get("priority") ?? "",
    categoryId: params.get("categoryId") ?? "",
    departmentId: params.get("departmentId") ?? "",
    wardId: params.get("wardId") ?? "",
    tagId: params.get("tagId") ?? "",
    search: params.get("search") ?? "",
  };
  const page = Number(params.get("page") ?? "1");

  const push = useCallback(
    (next: Filters, nextPage: number) => {
      const q = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value) q.set(key, value);
      }
      if (nextPage > 1) q.set("page", String(nextPage));
      const qs = q.toString();
      router.push(qs ? `/grievances?${qs}` : "/grievances");
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (next: Filters) => push(next, 1),
    [push],
  );

  const query = useQuery({
    queryKey: qk.grievances({ ...filters, page }),
    queryFn: async () => {
      const q = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) q.set(key, value);
      }
      q.set("page", String(page));
      q.set("limit", String(PAGE_SIZE));
      const res = await http.get<Paginated<Grievance>>(`/grievances?${q}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(user),
  });

  if (!user) return <Spinner label="Loading" />;

  const heading = HEADINGS[user.role];
  const hasFilters = Object.values(filters).some((v) => v !== "");

  return (
    <>
      <PageHeader
        title={heading.title}
        description={heading.description}
        action={
          user.role === "citizen" ? (
            <Button onClick={() => router.push("/grievances/new")}>
              Report a problem
            </Button>
          ) : undefined
        }
      />

      <GrievanceFilters
        filters={filters}
        role={user.role}
        onChange={handleFilterChange}
      />

      {query.isLoading && <Spinner label="Loading complaints" />}

      {query.isError && (
        <ErrorState
          message={errorMessage(query.error)}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {query.data && query.data.total === 0 && (
        <EmptyState
          title={
            hasFilters ? "No complaints match those filters" : "No complaints yet"
          }
          description={
            hasFilters
              ? "Try clearing a filter or two to widen the search."
              : user.role === "citizen"
                ? "When you report a problem it will appear here with a tracking code you can follow."
                : "Nothing has been assigned to your department and wards yet."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={() => push(EMPTY_FILTERS, 1)}>
                Clear filters
              </Button>
            ) : user.role === "citizen" ? (
              <Button onClick={() => router.push("/grievances/new")}>
                Report a problem
              </Button>
            ) : undefined
          }
        />
      )}

      {query.data && query.data.total > 0 && (
        <>
          <div className="flex flex-col gap-3" aria-busy={query.isFetching}>
            {query.data.data.map((g) => (
              <GrievanceCard key={g.id} grievance={g} role={user.role} />
            ))}
          </div>

          <Pagination
            page={query.data.page}
            limit={query.data.limit}
            total={query.data.total}
            onPageChange={(next) => push(filters, next)}
          />
        </>
      )}
    </>
  );
}

export default function GrievancesPage() {
  return (
    <Suspense fallback={<Spinner label="Loading complaints" />}>
      <GrievanceList />
    </Suspense>
  );
}