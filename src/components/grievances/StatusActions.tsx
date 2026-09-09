"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useChangeStatus } from "@/hooks/useChangeStatus";
import { ACTION_CONFIRM, ACTION_LABEL } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import type { GrievanceAction } from "@/lib/types";

const DESTRUCTIVE: GrievanceAction[] = ["CLOSE"];

export default function StatusActions({
  grievanceId,
  actions,
}: {
  grievanceId: string;
  actions: GrievanceAction[];
}) {
  const [pendingAction, setPendingAction] = useState<GrievanceAction | null>(
    null,
  );
  const { showToast } = useToast();
  const mutation = useChangeStatus(grievanceId);

  const visible = actions.filter((a) => a !== "CITIZEN_REPLY");
  if (visible.length === 0) return null;

  function run(action: GrievanceAction) {
    mutation.mutate(action, {
      onSuccess: () => {
        setPendingAction(null);
        showToast("The complaint has been updated", "success");
      },
      onError: (error) => {
        setPendingAction(null);
        showToast(errorMessage(error), "error");
      },
    });
  }

  function onClick(action: GrievanceAction) {
    if (ACTION_CONFIRM[action]) {
      setPendingAction(action);
      return;
    }
    run(action);
  }

  const confirm = pendingAction ? ACTION_CONFIRM[pendingAction] : undefined;

  return (
    <div className="rounded-card border border-n-200 bg-surface p-4">
      <h3 className="mb-3 text-meta text-n-500">What happens next</h3>
      <div className="flex flex-wrap gap-3">
        {visible.map((action, index) => (
          <Button
            key={action}
            variant={
              DESTRUCTIVE.includes(action)
                ? "danger"
                : index === 0
                  ? "primary"
                  : "secondary"
            }
            loading={mutation.isPending && mutation.variables === action}
            disabled={mutation.isPending}
            onClick={() => onClick(action)}
          >
            {ACTION_LABEL[action]}
          </Button>
        ))}
      </div>

      {confirm && pendingAction && (
        <ConfirmDialog
          open
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          tone={DESTRUCTIVE.includes(pendingAction) ? "danger" : "primary"}
          loading={mutation.isPending}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => run(pendingAction)}
        />
      )}
    </div>
  );
}