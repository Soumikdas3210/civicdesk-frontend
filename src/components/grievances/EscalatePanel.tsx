"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useEscalate } from "@/hooks/useGrievanceActions";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import type { Priority } from "@/lib/constants";
import type { Grievance } from "@/lib/types";

export default function EscalatePanel({ grievance }: { grievance: Grievance }) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState("");
  const [reason, setReason] = useState("");
  const [notifyAdmin, setNotifyAdmin] = useState(false);
  const { showToast } = useToast();
  const escalate = useEscalate(grievance.id);

  const currentIndex = PRIORITY_ORDER.indexOf(grievance.priority);
  const higher = PRIORITY_ORDER.slice(currentIndex + 1);
  const canEscalate = higher.length > 0;

  function run() {
    escalate.mutate(
      {
        targetPriority: priority ? (priority as Priority) : undefined,
        notifyAdmin: notifyAdmin || undefined,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setPriority("");
          setReason("");
          setNotifyAdmin(false);
          showToast("The complaint has been escalated", "success");
        },
        onError: (error) => showToast(errorMessage(error), "error"),
      },
    );
  }

  return (
    <Card>
      <h3 className="mb-1 text-meta text-n-500">Priority</h3>
      <p className="mb-3 text-secondary">
        {PRIORITY_LABEL[grievance.priority]}
      </p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Escalate
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Escalate this complaint"
        description="Raising the priority tightens the existing deadlines. It does not restart them and it does not change the status."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={escalate.isPending}
              disabled={!priority && !notifyAdmin}
              onClick={run}
            >
              Escalate
            </Button>
          </>
        }
      >
        {canEscalate ? (
          <Field
            label="Raise priority to"
            help="Priority can only go up. Leave this blank to only notify an admin."
          >
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">Leave as {PRIORITY_LABEL[grievance.priority]}</option>
              {higher.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="mb-6 text-secondary text-n-500">
            This is already at the highest priority. You can still notify an
            admin.
          </p>
        )}

        <Field label="Reason" help="Optional. Included in the admin's notification.">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Flooding has reached the school gate"
          />
        </Field>

        <label className="flex min-h-11 items-center gap-3 text-secondary">
          <input
            type="checkbox"
            checked={notifyAdmin}
            onChange={(e) => setNotifyAdmin(e.target.checked)}
            className="size-5 rounded border-n-300"
          />
          Notify an admin
        </label>
      </Modal>
    </Card>
  );
}