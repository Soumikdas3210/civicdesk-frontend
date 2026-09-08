"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import ManageStaffModal from "@/components/admin/ManageStaffModal";
import StaffForm from "@/components/admin/StaffForm";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDepartments, useWards } from "@/hooks/useTaxonomy";
import type { BadgeTone } from "@/components/ui/Badge";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import { ROLE_LABEL } from "@/lib/roles";
import type { StaffInput } from "@/lib/schemas/staff";
import type { Paginated, StaffRole, StaffUser } from "@/lib/types";

const LIMIT = 20;
const FORM_ID = "staff-form";

const ROLE_TONE: Record<StaffRole, BadgeTone> = {
  admin: "progress",
  officer: "open",
  citizen: "closed",
};

const ROLE_OPTIONS: StaffRole[] = ["citizen", "officer", "admin"];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const me = useCurrentUser();
  const departments = useDepartments();
  const wards = useWards();

  const [roleFilter, setRoleFilter] = useState<"" | StaffRole>("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [managing, setManaging] = useState<StaffUser | null>(null);

  const usersQuery = useQuery({
    queryKey: qk.users({ role: roleFilter, departmentId: deptFilter, page }),
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (roleFilter) params.role = roleFilter;
      if (deptFilter) params.departmentId = deptFilter;
      return (await http.get<Paginated<StaffUser>>("/users", { params })).data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const deptName = useMemo(() => {
    const map = new Map(
      (departments.data ?? []).map((d) => [d.id, d.name] as const),
    );
    return (id: string | null) => (id ? (map.get(id) ?? "Unknown") : "-");
  }, [departments.data]);

  function changeRole(value: string) {
    setRoleFilter(value as "" | StaffRole);
    setPage(1);
  }

  function changeDept(value: string) {
    setDeptFilter(value);
    setPage(1);
  }

  function clearFilters() {
    setRoleFilter("");
    setDeptFilter("");
    setPage(1);
  }

  function openAdd() {
    setAddError(null);
    setModalOpen(true);
  }

  const addMutation = useMutation({
    mutationFn: async (input: StaffInput) => {
      const body: Record<string, string> = {
        email: input.email,
        fullName: input.fullName,
        password: input.password,
        role: input.role,
      };
      if (input.phone && input.phone.trim()) body.phone = input.phone.trim();
      return (await http.post<StaffUser>("/users", body)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("Staff added.", "success");
      setModalOpen(false);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setAddError("An account with that email already exists.");
        return;
      }
      setAddError(errorMessage(error));
    },
  });

  const data = usersQuery.data;
  const rows = data?.data ?? [];
  const hasFilter = roleFilter !== "" || deptFilter !== "";
  const pureEmpty = data?.total === 0 && !hasFilter;

  return (
    <>
      <PageHeader
        title="Users"
        description={
          data
            ? `${data.total} account${data.total === 1 ? "" : "s"}. Officers and admins are created here; citizens sign themselves up.`
            : "Officers and admins are created here; citizens sign themselves up."
        }
        action={<Button onClick={openAdd}>Add staff</Button>}
      />

      {usersQuery.isLoading && <Spinner label="Loading users" />}

      {usersQuery.isError && !data && (
        <ErrorState
          message={errorMessage(usersQuery.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void usersQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      )}

      {data && pureEmpty && (
        <EmptyState
          title="No users yet"
          description="Add the first officer or admin. Citizens appear here once they register."
          action={<Button onClick={openAdd}>Add staff</Button>}
        />
      )}

      {data && !pureEmpty && (
        <>
          <div className="mb-6 rounded-card border border-n-200 bg-surface p-4">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Role">
                <Select
                  value={roleFilter}
                  onChange={(event) => changeRole(event.target.value)}
                >
                  <option value="">All roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Department">
                <Select
                  value={deptFilter}
                  onChange={(event) => changeDept(event.target.value)}
                  disabled={departments.isLoading}
                >
                  <option value="">All departments</option>
                  {(departments.data ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-card border border-n-200 bg-surface p-8 text-center">
              <p className="text-body text-n-500">
                No users match these filters.
              </p>
              <Button variant="ghost" onClick={clearFilters} className="mt-3">
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Role</TH>
                    <TH>Department</TH>
                    <TH>Status</TH>
                    <TH className="text-right">
                      <span className="sr-only">Actions</span>
                    </TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((user) => (
                    <TR key={user.id}>
                      <TD className="font-semibold text-n-900">
                        {user.fullName}
                      </TD>
                      <TD className="text-n-500">{user.email}</TD>
                      <TD>
                        <Badge tone={ROLE_TONE[user.role]}>
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </TD>
                      <TD className="text-n-500">
                        {deptName(user.departmentId)}
                      </TD>
                      <TD>
                        <Badge tone={user.isActive ? "resolved" : "closed"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => setManaging(user)}
                          >
                            Manage
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>

              <Pagination
                page={page}
                limit={data.limit}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add staff"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              loading={addMutation.isPending}
            >
              Add staff
            </Button>
          </>
        }
      >
        {modalOpen && (
          <StaffForm
            key="add"
            formId={FORM_ID}
            serverError={addError}
            onValidSubmit={(values) => addMutation.mutate(values)}
          />
        )}
      </Modal>

      <ManageStaffModal
        user={managing}
        currentUserId={me.data?.id}
        departments={departments.data ?? []}
        departmentsLoading={departments.isLoading}
        wards={wards.data ?? []}
        wardsLoading={wards.isLoading}
        onClose={() => setManaging(null)}
        onChanged={() => {
          void queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
      />
    </>
  );
}
