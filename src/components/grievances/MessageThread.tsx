"use client";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Spinner from "@/components/ui/Spinner";
import { useMessages, usePostMessage } from "@/hooks/useMessages";
import { errorMessage } from "@/lib/errors";
import type { Role } from "@/lib/roles";
import type { GrievanceStatus } from "@/lib/constants";
import MessageBubble from "./MessageBubble";
import ReplyBox from "./ReplyBox";

export default function MessageThread({
  grievanceId,
  citizenId,
  status,
  role,
  currentUserId,
  canReply,
}: {
  grievanceId: string;
  citizenId: string;
  status: GrievanceStatus;
  role: Role;
  currentUserId: string;
  canReply: boolean;
}) {
  const query = useMessages(grievanceId);
  const post = usePostMessage(grievanceId);

  function authorLabel(authorId: string): string {
    if (authorId === currentUserId) return "You";
    if (authorId === citizenId) return "The person who reported this";
    return "Council officer";
  }

  return (
    <section aria-labelledby="thread-heading">
      <h3 id="thread-heading" className="mb-3 text-card-title">
        Conversation
      </h3>

      {query.isLoading && <Spinner label="Loading the conversation" />}

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

      {query.data && query.data.length === 0 && (
        <EmptyState
          title="No replies yet"
          description={
            role === "citizen"
              ? "When an officer replies you will see it here, and you will get a notification."
              : "Nothing has been said on this complaint yet."
          }
        />
      )}

      {query.data && query.data.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {query.data.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              authorLabel={authorLabel(m.authorId)}
              isMine={m.authorId === currentUserId}
            />
          ))}
        </div>
      )}

      {canReply && (
        <ReplyBox
          role={role}
          status={status}
          pending={post.isPending}
          error={post.error}
          onSend={(input) => post.mutate(input)}
        />
      )}
    </section>
  );
}