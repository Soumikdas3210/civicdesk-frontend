"use client";

import { useState } from "react";
import CannedResponsePicker from "@/components/engagement/CannedResponsePicker";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/Textarea";
import { errorMessage, fieldErrors, zodFieldErrors } from "@/lib/errors";
import { createMessageSchema } from "@/lib/schemas/message";
import type { Role } from "@/lib/roles";
import type { GrievanceStatus } from "@/lib/constants";

export default function ReplyBox({
  role,
  status,
  pending,
  onSend,
  error,
}: {
  role: Role;
  status: GrievanceStatus;
  pending: boolean;
  onSend: (input: { body: string; isInternal: boolean }) => void;
  error: unknown;
}) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const isStaff = role !== "citizen";
  const serverFields = fieldErrors(error);
  const shownError = fieldError ?? serverFields.body;
  const formError =
    error && Object.keys(serverFields).length === 0
      ? errorMessage(error)
      : null;

  function submit() {
    const parsed = createMessageSchema.safeParse({ body, isInternal });
    if (!parsed.success) {
      setFieldError(zodFieldErrors(parsed.error).body);
      return;
    }
    setFieldError(undefined);
    onSend({ body: parsed.data.body, isInternal });
    setBody("");
  }

  return (
    <div className="rounded-card border border-n-200 bg-surface p-4">
      {!isStaff && status === "WAITING_ON_CITIZEN" && (
        <p className="mb-4 rounded-ctl border border-waiting bg-waiting-tint p-3 text-secondary text-waiting">
          An officer has asked you a question. Replying will move this back to
          in progress.
        </p>
      )}

      {isStaff && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-ctl border border-n-200 p-0.5"
            role="group"
            aria-label="Who can see this reply"
          >
            <button
              type="button"
              onClick={() => setIsInternal(false)}
              aria-pressed={!isInternal}
              className={
                !isInternal
                  ? "min-h-11 rounded-ctl bg-primary-600 px-4 text-secondary font-semibold text-white"
                  : "min-h-11 rounded-ctl px-4 text-secondary font-semibold text-n-700"
              }
            >
              Reply to citizen
            </button>
            <button
              type="button"
              onClick={() => setIsInternal(true)}
              aria-pressed={isInternal}
              className={
                isInternal
                  ? "min-h-11 rounded-ctl bg-waiting px-4 text-secondary font-semibold text-white"
                  : "min-h-11 rounded-ctl px-4 text-secondary font-semibold text-n-700"
              }
            >
              Internal note
            </button>
          </div>

          <CannedResponsePicker onSelect={(text) => setBody(text)} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Field
          label={isInternal ? "Internal note" : "Your reply"}
          help={
            isInternal
              ? "Only officers and admins will see this."
              : undefined
          }
          error={shownError}
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              isInternal
                ? "Context for the next officer who picks this up"
                : isStaff
                  ? "Tell the citizen what is happening"
                  : "Add anything that might help"
            }
            rows={4}
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-ctl border border-danger bg-danger-tint p-3 text-secondary font-semibold text-danger"
          >
            <span aria-hidden="true">!</span>
            <span>{formError}</span>
          </p>
        )}

        <Button type="submit" loading={pending}>
          {isInternal ? "Save internal note" : "Send reply"}
        </Button>
      </form>
    </div>
  );
}