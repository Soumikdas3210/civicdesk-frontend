"use client";

import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import AttachmentsPanel from "@/components/engagement/AttachmentsPanel";
import RatingPanel from "@/components/engagement/RatingPanel";
import TagsPanel from "@/components/engagement/TagsPanel";
import DetailsPanel from "@/components/grievances/DetailsPanel";
import PriorityBadge from "@/components/grievances/PriorityBadge";
import StatusBadge from "@/components/grievances/StatusBadge";
import StatusTimeline from "@/components/grievances/StatusTimeline";
import TrackingCode from "@/components/grievances/TrackingCode";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Spinner from "@/components/ui/Spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGrievance } from "@/hooks/useGrievance";
import { errorMessage } from "@/lib/errors";
import MessageThread from "@/components/grievances/MessageThread";
import StatusActions from "@/components/grievances/StatusActions";

export default function GrievanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const query = useGrievance(params.id);

  if (!user || query.isLoading) {
    return <Spinner label="Loading complaint" />;
  }

  if (query.isError) {
    const notFound =
      axios.isAxiosError(query.error) && query.error.response?.status === 404;

    return (
      <ErrorState
        title={notFound ? "We could not find that complaint" : undefined}
        message={
          notFound
            ? "It may have been removed, or the link may be wrong. Check the tracking code and try again."
            : errorMessage(query.error)
        }
        action={
          <Button variant="secondary" onClick={() => router.push("/grievances")}>
            Back to complaints
          </Button>
        }
      />
    );
  }

  const g = query.data;
  if (!g) return null;

  const isStaff = user.role !== "citizen";

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push("/grievances")}
        className="mb-4 -ml-3"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to complaints
      </Button>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <TrackingCode code={g.trackingCode} />
        <StatusBadge status={g.status} role={user.role} />
        <PriorityBadge priority={g.priority} />
      </div>

      <h2 className="mb-5 text-section-title">{g.title}</h2>

      <div className="mb-6">
        <StatusTimeline status={g.status} />
      </div>

      {g.status === "CLOSED" && user.role === "citizen" && (
        <p className="mb-6 rounded-ctl border border-n-200 bg-n-100 p-3 text-secondary text-n-700">
          This complaint has been closed and cannot be reopened. If the problem
          has come back, please report it as a new complaint.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h3 className="mb-2 text-meta text-n-500">
              {isStaff ? "What was reported" : "What you reported"}
            </h3>
            <p className="whitespace-pre-wrap">{g.description}</p>
          </Card>
          {g.availableActions && g.availableActions.length > 0 && (
            <StatusActions
              grievanceId={g.id}
              actions={g.availableActions}
            />
          )}
          <MessageThread
            grievanceId={g.id}
            citizenId={g.citizenId}
            status={g.status}
            role={user.role}
            currentUserId={user.id}
            canReply={
              user.role === "admin" ||
              (user.role === "citizen" && g.citizenId === user.id) ||
              (user.role === "officer" && g.assignedOfficerId === user.id)
            }
          />
        </div>

        <div className="space-y-6">
          <DetailsPanel grievance={g} />
          <TagsPanel grievanceId={g.id} />
          <AttachmentsPanel grievanceId={g.id} />
          <RatingPanel grievanceId={g.id} />
        </div>
      </div>
    </>
  );
}