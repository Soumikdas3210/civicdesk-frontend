"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CategoryForm from "@/components/admin/CategoryForm";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useCategories, useDepartments } from "@/hooks/useTaxonomy";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import type { Category } from "@/lib/types";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; category: Category }
  | null;

type SavePayload = {
  name: string;
  description: string;
  departmentId: string;
  isActive: boolean;
};

const FORM_ID = "category-form";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const categories = useCategories({ includeInactive: true });
  const departments = useDepartments();

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const deptName = useMemo(() => {
    const map = new Map<string, string>();
    for (const department of departments.data ?? []) {
      map.set(department.id, department.name);
    }
    return (id: string) => map.get(id) ?? "Unknown department";
  }, [departments.data]);

  const all = categories.data ?? [];
  const filtered = all.filter((category) => {
    if (departmentFilter && category.departmentId !== departmentFilter) {
      return false;
    }
    if (!showRetired && !category.isActive) return false;
    return true;
  });

  function openCreate() {
    setFormError(null);
    setModal({ mode: "create" });
  }

  function openEdit(category: Category) {
    setFormError(null);
    setModal({ mode: "edit", category });
  }

  function clearFilters() {
    setDepartmentFilter("");
    setShowRetired(false);
  }

  const saveMutation = useMutation({
    mutationFn: async (input: SavePayload) => {
      if (modal?.mode === "edit") {
        return (
          await http.patch<Category>(`/categories/${modal.category.id}`, input)
        ).data;
      }
      return (
        await http.post<Category>("/categories", {
          name: input.name,
          description: input.description,
          departmentId: input.departmentId,
        })
      ).data;
    },
    onSuccess: () => {
      const wasEdit = modal?.mode === "edit";
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      showToast(wasEdit ? "Changes saved." : "Category added.", "success");
      setModal(null);
    },
    onError: (error) => {
      setFormError(errorMessage(error));
    },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description={
          categories.data
            ? `${all.length} categor${all.length === 1 ? "y" : "ies"}. Categories route complaints to a department and drive SLA policies.`
            : "Categories route complaints to a department and drive SLA policies."
        }
        action={<Button onClick={openCreate}>Add category</Button>}
      />

      {categories.isLoading && <Spinner label="Loading categories" />}

      {categories.isError && (
        <ErrorState
          message={errorMessage(categories.error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void categories.refetch()}
            >
              Try again
            </Button>
          }
        />
      )}

      {categories.data && all.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Add the first category. You can then give it an SLA policy and route complaints to it."
          action={<Button onClick={openCreate}>Add category</Button>}
        />
      )}

      {categories.data && all.length > 0 && (
        <>
          <div className="mb-6 rounded-card border border-n-200 bg-surface p-4">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Department">
                <Select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
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

              <div className="flex items-end">
                <Checkbox
                  checked={showRetired}
                  onChange={setShowRetired}
                  label="Show retired"
                  className="mb-6 sm:mb-0"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-card border border-n-200 bg-surface p-8 text-center">
              <p className="text-body text-n-500">
                No categories match these filters.
              </p>
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="mt-3"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Department</TH>
                  <TH>Status</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((category) => (
                  <TR key={category.id}>
                    <TD className="font-semibold text-n-900">
                      {category.name}
                    </TD>
                    <TD className="text-n-500">
                      {deptName(category.departmentId)}
                    </TD>
                    <TD>
                      <Badge tone={category.isActive ? "resolved" : "closed"}>
                        {category.isActive ? "Active" : "Retired"}
                      </Badge>
                    </TD>
                    <TD className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => openEdit(category)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit category" : "Add category"}
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
              {modal?.mode === "edit" ? "Save changes" : "Add category"}
            </Button>
          </>
        }
      >
        {modal && (
          <CategoryForm
            key={modal.mode === "edit" ? modal.category.id : "create"}
            formId={FORM_ID}
            mode={modal.mode}
            initial={
              modal.mode === "edit"
                ? {
                    name: modal.category.name,
                    description: modal.category.description ?? "",
                    departmentId: modal.category.departmentId,
                    isActive: modal.category.isActive,
                  }
                : { name: "", description: "", departmentId: "", isActive: true }
            }
            departments={departments.data ?? []}
            departmentsLoading={departments.isLoading}
            serverError={formError}
            onValidSubmit={(values) => saveMutation.mutate(values)}
          />
        )}
      </Modal>
    </>
  );
}
