"use client";

import { Fragment, useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SlaPolicyForm, {
  type CategoryOption,
} from "@/components/admin/SlaPolicyForm";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useCategories, useDepartments } from "@/hooks/useTaxonomy";
import { PRIORITY_LABEL, PRIORITY_ORDER, PRIORITY_TONE } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { SlaPolicyInput } from "@/lib/schemas/slaPolicy";
import type { SlaPolicy } from "@/lib/types";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; policy: SlaPolicy }
  | null;

const FORM_ID = "sla-policy-form";

export default function SlaPoliciesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const policies = useQuery({
    queryKey: qk.slaPolicies,
    queryFn: async () =>
      (await http.get<SlaPolicy[]>("/sla-policies")).data,
    staleTime: 5 * 60 * 1000,
  });
  const categories = useCategories({ includeInactive: true });
  const departments = useDepartments();

  const [modal, setModal] = useState<ModalState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<SlaPolicy | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const catInfo = useMemo(() => {
    const deptName = new Map(
      (departments.data ?? []).map((d) => [d.id, d.name] as const),
    );
    const map = new Map<
      string,
      { name: string; isActive: boolean; departmentName: string }
    >();
    for (const category of categories.data ?? []) {
      map.set(category.id, {
        name: category.name,
        isActive: category.isActive,
        departmentName: deptName.get(category.departmentId) ?? "",
      });
    }
    return map;
  }, [categories.data, departments.data]);

  const groups = useMemo(() => {
    const byCat = new Map<string, SlaPolicy[]>();
    for (const policy of policies.data ?? []) {
      const rows = byCat.get(policy.categoryId) ?? [];
      rows.push(policy);
      byCat.set(policy.categoryId, rows);
    }
    return [...byCat.entries()]
      .map(([categoryId, rows]) => ({
        categoryId,
        name: catInfo.get(categoryId)?.name ?? "Unknown category",
        departmentName: catInfo.get(categoryId)?.departmentName ?? "",
        rows: [...rows].sort(
          (a, b) =>
            PRIORITY_ORDER.indexOf(a.priority) -
            PRIORITY_ORDER.indexOf(b.priority),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [policies.data, catInfo]);

  function categoryOptions(state: ModalState): CategoryOption[] {
    const options: CategoryOption[] = (categories.data ?? [])
      .filter((category) => category.isActive)
      .map((category) => ({ id: category.id, label: category.name }));

    if (state?.mode === "edit") {
      const current = state.policy.categoryId;
      if (!options.some((option) => option.id === current)) {
        options.push({
          id: current,
          label: `${catInfo.get(current)?.name ?? "Unknown category"} (retired)`,
        });
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  function openCreate() {
    setFormError(null);
    setModal({ mode: "create" });
  }

  function openEdit(policy: SlaPolicy) {
    setFormError(null);
    setModal({ mode: "edit", policy });
  }

  const saveMutation = useMutation({
    mutationFn: async (input: SlaPolicyInput) => {
      if (modal?.mode === "edit") {
        return (
          await http.patch<SlaPolicy>(
            `/sla-policies/${modal.policy.id}`,
            input,
          )
        ).data;
      }
      return (await http.post<SlaPolicy>("/sla-policies", input)).data;
    },
    onSuccess: () => {
      const wasEdit = modal?.mode === "edit";
      void queryClient.invalidateQueries({ queryKey: qk.slaPolicies });
      showToast(wasEdit ? "Changes saved." : "Policy added.", "success");
      setModal(null);
    },
    onError: (error, input) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const name = catInfo.get(input.categoryId)?.name ?? "that category";
        setFormError(
          `A ${PRIORITY_LABEL[input.priority]} policy already exists for ${name}. Edit that one instead.`,
        );
        return;
      }
      setFormError(errorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/sla-policies/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.slaPolicies });
      showToast("Policy deleted.", "success");
      setToDelete(null);
    },
    onError: (error) => {
      setDeleteError(errorMessage(error));
    },
  });

  const list = policies.data ?? [];

  return (
    <>
      <PageHeader
        title="SLA policies"
        description={
          policies.data
            ? `${list.length} polic${list.length === 1 ? "y" : "ies"}. Each one sets response and resolution targets for a category and priority.`
            : "Each policy sets response and resolution targets for a category and priority."
        }
        action={<Button onClick={openCreate}>Add policy</Button>}
      />

      {policies.isLoading && <Spinner label="Loading SLA policies" />}

      {policies.isError && (
        <ErrorState
          message={errorMessage(policies.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void policies.refetch()}
            >
              Try again
            </Button>
          }
        />
      )}

      {policies.data && list.length === 0 && (
        <EmptyState
          title="No SLA policies yet"
          description="Add a policy to set response and resolution targets for a category and priority. Until then, a system default applies to every complaint."
          action={<Button onClick={openCreate}>Add policy</Button>}
        />
      )}

      {policies.data && list.length > 0 && (
        <>
          <p className="mb-3 text-secondary text-n-500">
            If no policy matches a complaint&apos;s category and priority, a
            system default applies.
          </p>
          <Table>
            <THead>
              <TR>
                <TH>Priority</TH>
                <TH className="text-right">Response (hours)</TH>
                <TH className="text-right">Resolution (hours)</TH>
                <TH className="text-right">
                  <span className="sr-only">Actions</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {groups.map((group) => (
                <Fragment key={group.categoryId}>
                  <TR className="bg-n-50">
                    <TD colSpan={4} className="font-semibold text-n-700">
                      {group.name}
                      {group.departmentName && (
                        <span className="ml-2 font-normal text-n-500">
                          {group.departmentName}
                        </span>
                      )}
                    </TD>
                  </TR>
                  {group.rows.map((policy) => (
                    <TR key={policy.id}>
                      <TD>
                        <Badge tone={PRIORITY_TONE[policy.priority]}>
                          {PRIORITY_LABEL[policy.priority]}
                        </Badge>
                      </TD>
                      <TD className="text-right tabular-nums">
                        {policy.responseDueHours}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {policy.resolutionDueHours}
                      </TD>
                      <TD className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => openEdit(policy)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setDeleteError(null);
                              setToDelete(policy);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </Fragment>
              ))}
            </TBody>
          </Table>
        </>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit policy" : "Add policy"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              loading={saveMutation.isPending}
            >
              {modal?.mode === "edit" ? "Save changes" : "Add policy"}
            </Button>
          </>
        }
      >
        {modal && (
          <SlaPolicyForm
            key={modal.mode === "edit" ? modal.policy.id : "create"}
            formId={FORM_ID}
            initial={
              modal.mode === "edit"
                ? {
                    categoryId: modal.policy.categoryId,
                    priority: modal.policy.priority,
                    responseDueHours: String(modal.policy.responseDueHours),
                    resolutionDueHours: String(
                      modal.policy.resolutionDueHours,
                    ),
                  }
                : {
                    categoryId: "",
                    priority: "",
                    responseDueHours: "",
                    resolutionDueHours: "",
                  }
            }
            categoryOptions={categoryOptions(modal)}
            categoriesLoading={categories.isLoading}
            serverError={formError}
            onValidSubmit={(values) => saveMutation.mutate(values)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete policy"
        description={
          toDelete
            ? `Delete the ${PRIORITY_LABEL[toDelete.priority]} policy for ${catInfo.get(toDelete.categoryId)?.name ?? "this category"}? Complaints already open keep their current targets.`
            : ""
        }
        confirmLabel="Delete policy"
        loading={deleteMutation.isPending}
        error={deleteError ?? undefined}
        onConfirm={() => {
          if (toDelete) deleteMutation.mutate(toDelete.id);
        }}
        onCancel={() => {
          setToDelete(null);
          setDeleteError(null);
        }}
      />
    </>
  );
}
