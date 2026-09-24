"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useCannedResponses } from "@/hooks/useCannedResponses";
import { useCategories, useDepartments } from "@/hooks/useTaxonomy";
import { errorMessage, fieldErrors, zodFieldErrors } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import { cannedResponseSchema } from "@/lib/schemas/cannedResponse";
import type { CannedResponse, Category, Department } from "@/lib/types";

type FormValues = {
  title: string;
  body: string;
  departmentId: string;
  categoryId: string;
};

const BLANK: FormValues = {
  title: "",
  body: "",
  departmentId: "",
  categoryId: "",
};

function toFormValues(template: CannedResponse): FormValues {
  return {
    title: template.title,
    body: template.body,
    departmentId: template.departmentId ?? "",
    categoryId: template.categoryId ?? "",
  };
}

function scopeText(
  template: CannedResponse,
  departments: Department[],
  categories: Category[],
): string {
  const departmentName =
    template.department?.name ??
    departments.find((d) => d.id === template.departmentId)?.name;
  const categoryName =
    template.category?.name ??
    categories.find((c) => c.id === template.categoryId)?.name;
  const parts = [departmentName, categoryName].filter(
    (v): v is string => Boolean(v),
  );
  return parts.length > 0 ? parts.join(" · ") : "Every officer";
}

export default function CannedResponsesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useCannedResponses();
  const departments = useDepartments();
  const categories = useCategories();

  const [editing, setEditing] = useState<CannedResponse | "new" | null>(null);
  const [values, setValues] = useState<FormValues>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CannedResponse | null>(null);

  function openCreate() {
    setEditing("new");
    setValues(BLANK);
    setErrors({});
    setFormError(null);
  }

  function openEdit(template: CannedResponse) {
    setEditing(template);
    setValues(toFormValues(template));
    setErrors({});
    setFormError(null);
  }

  function closeModal() {
    setEditing(null);
  }

  function update(key: keyof FormValues, value: string) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === "departmentId" && value) {
        const cat = (categories.data ?? []).find((c) => c.id === next.categoryId);
        if (cat && cat.departmentId !== value) next.categoryId = "";
      }
      return next;
    });
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (input: unknown) => {
      if (editing && editing !== "new") {
        return (
          await http.patch<CannedResponse>(
            `/canned-responses/${editing.id}`,
            input,
          )
        ).data;
      }
      return (await http.post<CannedResponse>("/canned-responses", input)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cannedResponses });
      showToast(
        editing !== "new" ? "Template updated." : "Template created.",
        "success",
      );
      setEditing(null);
    },
    onError: (error) => {
      const fields = fieldErrors(error);
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(errorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/canned-responses/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.cannedResponses });
      showToast("Template deleted.", "success");
      setDeleteTarget(null);
    },
    onError: (error) => {
      showToast(errorMessage(error), "error");
      setDeleteTarget(null);
    },
  });

  function handleSubmit() {
    setFormError(null);
    const parsed = cannedResponseSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    saveMutation.mutate(parsed.data);
  }

  const templates = query.data ?? [];
  const categoryOptions = (categories.data ?? []).filter(
    (c) => !values.departmentId || c.departmentId === values.departmentId,
  );

  return (
    <>
      <PageHeader
        title="Canned responses"
        description="Templates officers can insert into a reply and edit before sending."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New template
          </Button>
        }
      />

      {query.isLoading && <Spinner label="Loading templates" />}

      {query.isError && (
        <ErrorState
          message={errorMessage(query.error)}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {query.data && templates.length === 0 && (
        <EmptyState
          title="No templates yet"
          description="Create a canned response so officers can reply consistently to common issues."
          action={<Button onClick={openCreate}>New template</Button>}
        />
      )}

      {templates.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Body</TH>
              <TH>Scope</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {templates.map((t) => (
              <TR key={t.id}>
                <TD className="font-semibold text-n-900">{t.title}</TD>
                <TD className="max-w-[36ch] truncate text-n-500">{t.body}</TD>
                <TD className="text-n-500">
                  {scopeText(t, departments.data ?? [], categories.data ?? [])}
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(t)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="size-4" aria-hidden="true" />
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
        open={editing !== null}
        onClose={closeModal}
        title={editing !== "new" ? "Edit template" : "New template"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saveMutation.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <Field label="Title" error={errors.title} required>
            <Input
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Streetlight outage acknowledgement"
            />
          </Field>

          <Field
            label="Body"
            help="This is inserted into the reply box as-is. The officer can edit it before sending."
            error={errors.body}
            required
          >
            <Textarea
              value={values.body}
              onChange={(e) => update("body", e.target.value)}
              placeholder="Thank you for reporting this. We have logged it and a crew will..."
            />
          </Field>

          <Field
            label="Department"
            help="Leave the department empty to make this available to every officer."
            error={errors.departmentId}
          >
            <Select
              value={values.departmentId}
              onChange={(e) => update("departmentId", e.target.value)}
              disabled={departments.isLoading}
            >
              <option value="">Every department</option>
              {(departments.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Category"
            help="Optionally narrow this further to a single category."
            error={errors.categoryId}
          >
            <Select
              value={values.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              disabled={categories.isLoading}
            >
              <option value="">Every category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-ctl border border-danger bg-danger-tint p-3 text-secondary font-semibold text-danger"
            >
              <span aria-hidden="true">!</span>
              <span>{formError}</span>
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete template?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will no longer be available to officers. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
