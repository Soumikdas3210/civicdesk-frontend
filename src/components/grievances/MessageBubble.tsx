import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type { Message } from "@/lib/types";

export default function MessageBubble({
  message,
  authorLabel,
  isMine,
}: {
  message: Message;
  authorLabel: string;
  isMine: boolean;
}) {
  if (message.isInternal) {
    return (
      <article className="rounded-card border border-dashed border-waiting bg-waiting-tint p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Lock className="size-4 text-waiting" aria-hidden="true" />
          <span className="text-meta text-waiting">
            Internal note, not visible to the citizen
          </span>
        </div>
        <p className="mb-1.5 text-meta text-n-500">
          {authorLabel}
          <span aria-hidden="true"> · </span>
          {formatDateTime(message.createdAt)}
        </p>
        <p className="whitespace-pre-wrap">{message.body}</p>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "rounded-card border p-4",
        isMine ? "border-primary-200 bg-primary-50" : "border-n-200 bg-surface",
      )}
    >
      <p className="mb-1.5 text-meta text-n-500">
        {authorLabel}
        <span aria-hidden="true"> · </span>
        {formatDateTime(message.createdAt)}
      </p>
      <p className="whitespace-pre-wrap">{message.body}</p>
    </article>
  );
}