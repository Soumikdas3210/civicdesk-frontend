"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
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
import { useToast } from "@/components/ui/Toast";
import { useEscalationRules } from "@/hooks/useEscalationRules";
import { useDepartments } from "@/hooks/useTaxonomy";
import { cn } from "@/lib/cn";
import { PRIORITY_LABEL, PRIORITY_ORDER, type Priority } from "@/lib/constants";
import { errorMessage, fieldErrors, zodFieldErrors } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import {
  ACTION_LABEL,
  ACTION_ORDER,
  escalationRuleSchema,
  escalationRuleSentence,
  TRIGGER_LABEL,
  TRIGGER_ORDER,
} from "@/lib/schemas/escalationRule";
import type { EscalationAction, EscalationRule, EscalationTrigger } from "@/lib/types";

type FormValues = {
  name: string;
  trigger: EscalationTrigger;
  thresholdHours: string;
  priorityFilter: Priority | "";
  departmentId: string;
  action: EscalationAction;
  targetPriority: Priority | "";
  isActive: boolean;
};

const BLANK: FormValues = {
  name: "",
  trigger: "UNASSIGNED_FOR_HOURS",
  thresholdHours: "24",
  priorityFilter: "",
  departmentId: "",
  action: "NOTIFY_ADMIN",
  targetPriority: "",
  isActive: true,
};

function toFormValues(rule: EscalationRule): FormValues {
  return {
    name: rule.name,
    trigger: rule.trigger,
    thresholdHours: rule.thresholdHours != null ? String(rule.thresholdHours) : "",
    priorityFilter: rule.priorityFilter ?? "",
    departmentId: rule.departmentId ?? "",
    action: rule.action,
    targetPriority: rule.targetPriority ?? "",
    isActive: rule.isActive,
  };
}

export default function EscalationRulesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useEscalationRules();
  const departments = useDepartments();

  const [editing, setEditing] = useState<EscalationRule | "new" | null>(null);
  const [values, setValues] = useState<FormValues>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EscalationRule | null>(null);

  function openCreate() {
    setEditing("new");
    setValues(BLANK);
    setErrors({});
    setFormError(null);
  }

  function openEdit(rule: EscalationRule) {
    setEditing(rule);
    setValues(toFormValues(rule));
    setErrors({});
    setFormError(null);
  }

  function closeModal() {
    setEditing(null);
  }

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
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
          await http.patch<EscalationRule>(
            `/escalation-rules/${editing.id}`,
            input,
          )
        ).data;
      }
      return (await http.post<EscalationRule>("/escalation-rules", input)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.escalationRules });
      showToast(editing !== "new" ? "Rule updated." : "Rule created.", "success");
      setEditing(null);
    },
    onError: (error) => {
      const fields = fieldErrors(error);
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(errorMessage(error));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (rule: EscalationRule) =>
      (
        await http.patch<EscalationRule>(`/escalation-rules/${rule.id}`, {
          isActive: !rule.isActive,
        })
      ).data,
    onSuccess: (rule) => {
      void queryClient.invalidateQueries({ queryKey: qk.escalationRules });
      showToast(rule.isActive ? "Rule turned on." : "Rule turned off.", "success");
    },
    onError: (error) => showToast(errorMessage(error), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/escalation-rules/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.escalationRules });
      showToast("Rule deleted.", "success");
      setDeleteTarget(null);
    },
    onError: (error) => {
      showToast(errorMessage(error), "error");
      setDeleteTarget(null);
    },
  });

  function handleSubmit() {
    setFormError(null);
    const parsed = escalationRuleSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    saveMutation.mutate(parsed.data);
  }

  const rules = query.data ?? [];
  const selectedDeptName = (departments.data ?? []).find(
    (d) => d.id === values.departmentId,
  )?.name;
  const previewHours = Number(values.thresholdHours);
  const preview = escalationRuleSentence({
    trigger: values.trigger,
    thresholdHours: Number.isFinite(previewHours) ? previewHours : 0,
    priorityFilter: values.priorityFilter || null,
    action: values.action,
    targetPriority: values.targetPriority || null,
    departmentName: selectedDeptName,
  });

  return (
    <>
      <PageHeader
        title="Escalation rules"
        description="Turning a rule off keeps its history. Deleting it does not."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New rule
          </Button>
        }
      />

      {query.isLoading && <Spinner label="Loading rules" />}

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

      {query.data && rules.length === 0 && (
        <EmptyState
          title="No escalation rules yet"
          description="Create a rule so overdue or unassigned complaints get escalated automatically."
          action={<Button onClick={openCreate}>New rule</Button>}
        />
      )}

      {rules.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Rule</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {rules.map((rule) => (
              <TR key={rule.id} className={cn(!rule.isActive && "opacity-60")}>
                <TD className="max-w-[52ch]">
                  <p className="font-semibold text-n-900">{rule.name}</p>
                  <p className="mt-0.5 text-secondary text-n-500">
                    {escalationRuleSentence({
                      trigger: rule.trigger,
                      thresholdHours: rule.thresholdHours,
                      priorityFilter: rule.priorityFilter,
                      action: rule.action,
                      targetPriority: rule.targetPriority,
                      departmentName:
                        rule.department?.name ??
                        (departments.data ?? []).find(
                          (d) => d.id === rule.departmentId,
                        )?.name,
                    })}
                  </p>
                </TD>
                <TD>
                  <Badge tone={rule.isActive ? "resolved" : "closed"}>
                    {rule.isActive ? "Active" : "Off"}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(rule)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => toggleMutation.mutate(rule)}
                      loading={
                        toggleMutation.isPending &&
                        toggleMutation.variables?.id === rule.id
                      }
                    >
                      <Power className="size-4" aria-hidden="true" />
                      {rule.isActive ? "Turn off" : "Turn on"}
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleteTarget(rule)}>
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
        title={editing !== "new" ? "Edit rule" : "New rule"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
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
          <Field
            label="Name"
            help='A short label admins will recognize in the list, e.g. "Water Board unassigned 24h".'
            error={errors.name}
            required
          >
            <Input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Water Board unassigned 24h"
            />
          </Field>

          <Field label="Trigger" error={errors.trigger} required>
            <Select
              value={values.trigger}
              onChange={(e) =>
                update("trigger", e.target.value as EscalationTrigger)
              }
            >
              {TRIGGER_ORDER.map((t) => (
                <option key={t} value={t}>
                  {TRIGGER_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>

          {values.trigger === "UNASSIGNED_FOR_HOURS" && (
            <Field
              label="Threshold (hours)"
              help="How many hours a complaint can stay unassigned before this rule fires."
              error={errors.thresholdHours}
              required
            >
              <Input
                type="number"
                min={1}
                step={1}
                value={values.thresholdHours}
                onChange={(e) => update("thresholdHours", e.target.value)}
              />
            </Field>
          )}

          <Field
            label="Priority filter"
            help="Only apply this rule to complaints currently at this priority. Leave blank to apply to every priority."
            error={errors.priorityFilter}
          >
            <Select
              value={values.priorityFilter}
              onChange={(e) =>
                update("priorityFilter", e.target.value as Priority | "")
              }
            >
              <option value="">Any priority</option>
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Department"
            help="Only apply this rule to complaints in this department. Leave blank to apply across every department."
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

          <Field label="Action" error={errors.action} required>
            <Select
              value={values.action}
              onChange={(e) => update("action", e.target.value as EscalationAction)}
            >
              {ACTION_ORDER.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABEL[a]}
                </option>
              ))}
            </Select>
          </Field>

          {values.action === "RAISE_PRIORITY" && (
            <Field
              label="Raise to"
              help="The priority this rule sets when it fires."
              error={errors.targetPriority}
              required
            >
              <Select
                value={values.targetPriority}
                onChange={(e) =>
                  update("targetPriority", e.target.value as Priority | "")
                }
              >
                <option value="">Choose a priority</option>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label="Active"
            help="Turning a rule off keeps its history. Deleting it does not."
          >
            <button
              type="button"
              role="switch"
              aria-checked={values.isActive}
              onClick={() => update("isActive", !values.isActive)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-150",
                values.isActive ? "bg-primary-600" : "bg-n-200",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block size-5 translate-x-1 rounded-full bg-white transition-transform duration-150",
                  values.isActive && "translate-x-6",
                )}
              />
              <span className="sr-only">
                {values.isActive ? "Active" : "Inactive"}
              </span>
            </button>
          </Field>

          <p
            className="mb-4 rounded-ctl bg-primary-50 p-3 text-secondary text-primary-700"
            aria-live="polite"
          >
            {preview}
          </p>

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
        title="Delete rule?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed, along with its history. Turning it off instead keeps that history.`
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
