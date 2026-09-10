"use client";

import { useQuery } from "@tanstack/react-query";
import PublicFooter from "@/components/layout/PublicFooter";
import PublicHeader from "@/components/layout/PublicHeader";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";

type ApiStatus = { status: string; name: string };

function ApiStatusLine() {
  const query = useQuery({
    queryKey: qk.apiStatus,
    queryFn: async () => (await http.get<ApiStatus>("/health")).data,
    retry: false,
    staleTime: 30_000,
  });

  if (query.isLoading) {
    return <span className="text-n-500">Checking...</span>;
  }

  if (query.isError || query.data?.status !== "ok") {
    return (
      <span className="font-semibold text-danger">
        Not responding. The API may not be running.
      </span>
    );
  }

  return (
    <span className="font-semibold text-resolved">
      {query.data.name} is responding
    </span>
  );
}

export default function AboutPage() {
  return (
    <>
      <PublicHeader />

      <main className="mx-auto max-w-page px-6 py-12">
        <h1 className="text-page-title">About CivicDesk</h1>
        <p className="mt-4 max-w-[65ch] text-n-500">
          CivicDesk routes complaints about public services to the department
          and the officer responsible for them, and keeps the person who
          reported it informed until it is closed.
        </p>

        <section className="mt-12">
          <h2 className="mb-3 text-section-title">How the routing works</h2>
          <p className="max-w-[65ch] text-n-500">
            Every complaint has a category and a ward. The category decides the
            department, and the ward decides which officers in that department
            can be assigned. An officer sees a complaint only if it is in their
            department and in a ward they cover. Change either, and anyone who
            no longer qualifies is unassigned automatically.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-3 text-section-title">Deadlines</h2>
          <p className="max-w-[65ch] text-n-500">
            Each complaint has a deadline for the first reply and one for
            resolution, set from the category and the priority. The clock pauses
            while a complaint is waiting on the person who reported it, so time
            spent waiting for an answer is not counted against the officer.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-3 text-section-title">The team</h2>
          <ul className="max-w-[65ch] space-y-1 text-n-500">
            <li>Soumik, the citizen and officer workflow</li>
            <li>Sazzadul, administration screens and analytics</li>
            <li>Safayat, notifications, attachments, ratings and tags</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="mb-3 text-section-title">Built with</h2>
          <p className="max-w-[65ch] text-n-500">
            NestJS and PostgreSQL on the server, Next.js on the client, with the
            session held in a cookie the browser cannot read.
          </p>
        </section>

        <section className="mt-12 rounded-card border border-n-200 bg-surface p-5">
          <h2 className="mb-1 text-meta text-n-500">Service status</h2>
          <p className="text-body">
            <ApiStatusLine />
          </p>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}