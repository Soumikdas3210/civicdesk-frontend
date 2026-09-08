"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DepartmentForm from "@/components/admin/DepartmentForm";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useCategories, useDepartments } from "@/hooks/useTaxonomy";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Department } from "@/lib/types";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; department: Department }
  | null;

const FORM_ID = "department-form";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const departments = useDepartments();
  const categories = useCategories({ includeInactive: true });

  const [modal, setModal] = useState<ModalState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Department | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setFormError(null);
    setModal({ mode: "create" });
  }

  function openEdit(department: Department) {
    setFormError(null);
    setModal({ mode: "edit", department });
  }

  const saveMutation = useMutation({
    mutationFn: async (input: { name: string; description: string }) => {
      if (modal?.mode === "edit") {
        return (
          await http.patch<Department>(
            `/departments/${modal.department.id}`,
            input,
          )
        ).data;
      }
      return (await http.post<Department>("/departments", input)).data;
    },
    onSuccess: () => {
      const wasEdit = modal?.mode === "edit";
      void queryClient.invalidateQueries({ queryKey: qk.departments });
      showToast(wasEdit ? "Changes saved." : "Department added.", "success");
      setModal(null);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError("A department with that name already exists.");
        return;
      }
      setFormError(errorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.departments });
      showToast("Department deleted.", "success");
      setToDelete(null);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setDeleteError(
          "This department still has officers or categories assigned. Move or remove them first.",
        );
        return;
      }
      setDeleteError(errorMessage(error));
    },
  });

  const countByDept = new Map<string, number>();
  for (const category of categories.data ?? []) {
    countByDept.set(
      category.departmentId,
      (countByDept.get(category.departmentId) ?? 0) + 1,
    );
  }

  function categoryCount(departmentId: string): string {
    if (categories.isLoading) return "…";
    if (categories.isError) return "-";
    return String(countByDept.get(departmentId) ?? 0);
  }

  const list = departments.data ?? [];

  return (
    <>
      <PageHeader
        title="Departments"
        description={
          departments.data
            ? `${list.length} department${list.length === 1 ? "" : "s"}. Each department owns a set of categories and officers.`
            : "Each department owns a set of categories and officers."
        }
        action={<Button onClick={openCreate}>Add department</Button>}
      />

      {departments.isLoading && <Spinner label="Loading departments" />}

      {departments.isError && (
        <ErrorState
          message={errorMessage(departments.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void departments.refetch()}
            >
              Try again
            </Button>
          }
        />
      )}

      {departments.data && list.length === 0 && (
        <EmptyState
          title="No departments yet"
          description="Add the first department. You can then give it categories, SLA policies and officers."
          action={<Button onClick={openCreate}>Add department</Button>}
        />
      )}

      {departments.data && list.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Description</TH>
              <TH className="text-right">Categories</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {list.map((department) => (
              <TR key={department.id}>
                <TD className="font-semibold text-n-900">{department.name}</TD>
                <TD className="text-n-500">{department.description || "-"}</TD>
                <TD className="text-right tabular-nums">
                  {categoryCount(department.id)}
                </TD>
                <TD className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => openEdit(department)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDeleteError(null);
                        setToDelete(department);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit department" : "Add department"}
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
              {modal?.mode === "edit" ? "Save changes" : "Add department"}
            </Button>
          </>
        }
      >
        {modal && (
          <DepartmentForm
            key={modal.mode === "edit" ? modal.department.id : "create"}
            formId={FORM_ID}
            initial={
              modal.mode === "edit"
                ? {
                    name: modal.department.name,
                    description: modal.department.description ?? "",
                  }
                : { name: "", description: "" }
            }
            serverError={formError}
            onValidSubmit={(values) => saveMutation.mutate(values)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete department"
        description={
          toDelete ? `Delete "${toDelete.name}"? This cannot be undone.` : ""
        }
        confirmLabel="Delete department"
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
