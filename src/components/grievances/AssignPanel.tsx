"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAssign, useEligibleOfficers } from "@/hooks/useGrievanceActions";
import { errorMessage } from "@/lib/errors";
import type { Role } from "@/lib/roles";
import type { Grievance } from "@/lib/types";

export default function AssignPanel({
  grievance,
  role,
  currentUserId,
}: {
  grievance: Grievance;
  role: Role;
  currentUserId: string;
}) {
  const [officerId, setOfficerId] = useState("");
  const { showToast } = useToast();
  const assign = useAssign(grievance.id);
  const officers = useEligibleOfficers(grievance.id, role === "admin");

  const isAssignedToMe = grievance.assignedOfficerId === currentUserId;

  function run(id?: string) {
    assign.mutate(id, {
      onSuccess: () => showToast("The complaint has been assigned", "success"),
      onError: (error) => showToast(errorMessage(error), "error"),
    });
  }

  if (role === "officer") {
    if (isAssignedToMe) {
      return (
        <Card>
          <h3 className="mb-1 text-meta text-n-500">Assignment</h3>
          <p className="text-secondary">This complaint is yours.</p>
        </Card>
      );
    }

    if (grievance.assignedOfficerId) {
      return (
        <Card>
          <h3 className="mb-1 text-meta text-n-500">Assignment</h3>
          <p className="text-secondary text-n-500">
            Another officer is handling this.
          </p>
        </Card>
      );
    }

    return (
      <Card>
        <h3 className="mb-1 text-meta text-n-500">Assignment</h3>
        <p className="mb-3 text-secondary text-n-500">
          Nobody has picked this up yet.
        </p>
        <Button loading={assign.isPending} onClick={() => run()}>
          Claim this complaint
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-1 text-meta text-n-500">Assignment</h3>
      <p className="mb-3 text-secondary text-n-500">
        {grievance.assignedOfficerId
          ? "An officer is handling this. You can move it to someone else."
          : "Nobody has picked this up yet."}
      </p>

      {officers.isLoading && <Spinner size="sm" />}

      {officers.data && officers.data.length === 0 && (
        <p className="text-secondary text-n-500">
          No officer covers this ward in {grievance.category.department?.name ?? "this department"}.
          Add ward coverage in Staff, or move the complaint to a different
          category.
        </p>
      )}

      {officers.data && officers.data.length > 0 && (
        <>
          <Field label="Officer">
            <Select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
            >
              <option value="">Choose an officer</option>
              {officers.data.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            loading={assign.isPending}
            disabled={!officerId}
            onClick={() => run(officerId)}
          >
            Assign
          </Button>
        </>
      )}
    </Card>
  );
}