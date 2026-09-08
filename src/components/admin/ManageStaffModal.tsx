"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABEL } from "@/lib/roles";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Department, StaffUser, Ward } from "@/lib/types";

type ManageStaffModalProps = {
  user: StaffUser | null;
  currentUserId: string | undefined;
  departments: Department[];
  departmentsLoading: boolean;
  wards: Ward[];
  wardsLoading: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export default function ManageStaffModal({
  user,
  currentUserId,
  departments,
  departmentsLoading,
  wards,
  wardsLoading,
  onClose,
  onChanged,
}: ManageStaffModalProps) {
  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={user ? `Manage ${user.fullName}` : ""}
      description={
        user
          ? [ROLE_LABEL[user.role], user.email, user.phone]
              .filter(Boolean)
              .join(" · ")
          : undefined
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {user && (
        <ManageStaffBody
          key={user.id}
          user={user}
          isSelf={user.id === currentUserId}
          departments={departments}
          departmentsLoading={departmentsLoading}
          wards={wards}
          wardsLoading={wardsLoading}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}

type BodyProps = {
  user: StaffUser;
  isSelf: boolean;
  departments: Department[];
  departmentsLoading: boolean;
  wards: Ward[];
  wardsLoading: boolean;
  onClose: () => void;
  onChanged: () => void;
};

const PANEL =
  "flex items-start gap-2 rounded-ctl border border-danger bg-danger-tint p-3 text-secondary font-semibold text-danger";
const SECTION = "border-t border-n-200 pt-5 mt-5";

function ManageStaffBody({
  user,
  isSelf,
  departments,
  departmentsLoading,
  wards,
  wardsLoading,
  onClose,
  onChanged,
}: BodyProps) {
  const { showToast } = useToast();

  const [departmentId, setDepartmentId] = useState(user.departmentId ?? "");
  const [confirming, setConfirming] = useState(false);

  const departmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await http.patch(`/users/${user.id}/department`, { departmentId: id });
    },
    onSuccess: () => {
      showToast("Department saved.", "success");
      onChanged();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      await http.patch(`/users/${user.id}/deactivate`);
    },
    onSuccess: () => {
      showToast("Account deactivated.", "success");
      onChanged();
      onClose();
    },
  });

  const immutableLine = (
    <p className="text-secondary text-n-500">
      Name, email and phone cannot be edited here.
    </p>
  );

  if (!user.isActive) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-n-900">
          This account is deactivated. There is no way to reactivate it here.
        </p>
        {immutableLine}
      </div>
    );
  }

  const isOfficer = user.role === "officer";
  const departmentUnchanged = departmentId === (user.departmentId ?? "");

  return (
    <div className="flex flex-col">
      {immutableLine}

      {isOfficer && (
        <div className="mt-5">
          <Field
            label="Department"
            help="Changing the department can return some of their assigned complaints to the queue."
          >
            <Select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              disabled={departmentsLoading}
            >
              <option value="">No department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>
          {departmentMutation.isError && (
            <p role="alert" className={PANEL}>
              <span aria-hidden="true">!</span>
              <span>{errorMessage(departmentMutation.error)}</span>
            </p>
          )}
          <Button
            className="mt-3"
            loading={departmentMutation.isPending}
            disabled={departmentId === "" || departmentUnchanged}
            onClick={() => departmentMutation.mutate(departmentId)}
          >
            Save department
          </Button>
        </div>
      )}

      {isOfficer && (
        <WardCoverageSection
          userId={user.id}
          userFullName={user.fullName}
          wards={wards}
          wardsLoading={wardsLoading}
          onSaved={onChanged}
        />
      )}

      <div className={SECTION}>
        <p className="font-semibold text-n-900">Deactivate</p>
        <p className="mt-1 text-secondary text-n-500">
          They are signed out on their next action
          {isOfficer ? " and their open complaints return to the queue" : ""}.
          This cannot be undone here.
        </p>

        {isSelf && (
          <p className="mt-2 text-secondary text-n-500">
            You cannot deactivate your own account.
          </p>
        )}

        {deactivateMutation.isError && (
          <p role="alert" className={`${PANEL} mt-3`}>
            <span aria-hidden="true">!</span>
            <span>{errorMessage(deactivateMutation.error)}</span>
          </p>
        )}

        {confirming ? (
          <div className="mt-3 flex flex-col gap-3 rounded-ctl border border-n-200 bg-n-50 p-3">
            <p className="text-secondary text-n-900">
              Deactivate {user.fullName}? This cannot be undone here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="danger"
                loading={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate()}
              >
                Yes, deactivate
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirming(false)}
                disabled={deactivateMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="danger"
            className="mt-3"
            disabled={isSelf}
            onClick={() => setConfirming(true)}
          >
            Deactivate account
          </Button>
        )}
      </div>
    </div>
  );
}

type WardCoverageSectionProps = {
  userId: string;
  userFullName: string;
  wards: Ward[];
  wardsLoading: boolean;
  onSaved: () => void;
};

/**
 * The backend has no endpoint that returns an officer's current wards, so we
 * derive it: fetch each ward's officer list and keep the wards this officer
 * appears in. The result seeds the checkboxes and is re-read after a save.
 */
function WardCoverageSection({
  userId,
  userFullName,
  wards,
  wardsLoading,
  onSaved,
}: WardCoverageSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const wardsKey = wards
    .map((ward) => ward.id)
    .sort()
    .join(",");

  const coverage = useQuery({
    queryKey: [...qk.officerWards(userId), wardsKey],
    enabled: wards.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const results = await Promise.all(
        wards.map((ward) =>
          http
            .get<StaffUser[]>(`/wards/${ward.id}/officers`)
            .then((res) => ({ wardId: ward.id, officers: res.data })),
        ),
      );
      return results
        .filter((result) => result.officers.some((o) => o.id === userId))
        .map((result) => result.wardId);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await http.patch(`/users/${userId}/wards`, { wardIds: ids });
    },
    onSuccess: () => {
      showToast("Ward coverage saved.", "success");
      onSaved();
      void queryClient.invalidateQueries({
        queryKey: qk.officerWards(userId),
      });
    },
  });

  return (
    <div className={SECTION}>
      <p className="font-semibold text-n-900">Wards</p>
      <p className="mt-1 mb-3 text-secondary text-n-500">
        Tick every ward {userFullName} covers. Unticking one removes it on save.
      </p>

      {wardsLoading || coverage.isLoading ? (
        <p className="text-secondary text-n-500">Checking current coverage...</p>
      ) : wards.length === 0 ? (
        <p className="text-secondary text-n-500">
          No wards have been created yet.
        </p>
      ) : coverage.isError ? (
        <div className="flex flex-col gap-3">
          <p role="alert" className={PANEL}>
            <span aria-hidden="true">!</span>
            <span>Could not load this officer&apos;s current ward coverage.</span>
          </p>
          <div>
            <Button
              variant="secondary"
              onClick={() => void coverage.refetch()}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <WardEditor
          key={[...(coverage.data ?? [])].sort().join(",") || "none"}
          allWards={wards}
          initialSelected={coverage.data ?? []}
          saving={saveMutation.isPending}
          saveError={
            saveMutation.isError ? errorMessage(saveMutation.error) : null
          }
          onSave={(ids) => saveMutation.mutate(ids)}
        />
      )}
    </div>
  );
}

type WardEditorProps = {
  allWards: Ward[];
  initialSelected: string[];
  saving: boolean;
  saveError: string | null;
  onSave: (ids: string[]) => void;
};

function WardEditor({
  allWards,
  initialSelected,
  saving,
  saveError,
  onSave,
}: WardEditorProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  return (
    <>
      <div className="flex flex-col gap-1">
        {allWards.map((ward) => (
          <Checkbox
            key={ward.id}
            checked={selected.includes(ward.id)}
            onChange={(checked) =>
              setSelected((current) =>
                checked
                  ? [...current, ward.id]
                  : current.filter((id) => id !== ward.id),
              )
            }
            label={`${ward.name} (${ward.code})`}
          />
        ))}
      </div>

      {saveError && (
        <p role="alert" className={`${PANEL} mt-3`}>
          <span aria-hidden="true">!</span>
          <span>{saveError}</span>
        </p>
      )}

      <Button className="mt-3" loading={saving} onClick={() => onSave(selected)}>
        {selected.length === 0
          ? "Save (remove all wards)"
          : `Save wards (${selected.length})`}
      </Button>
    </>
  );
}
