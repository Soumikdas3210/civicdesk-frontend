import { z } from "zod";
import { PRIORITY_LABEL, PRIORITY_ORDER, type Priority } from "@/lib/constants";
import type { EscalationAction, EscalationTrigger } from "@/lib/types";

export const TRIGGER_ORDER: EscalationTrigger[] = [
  "RESPONSE_OVERDUE",
  "RESOLUTION_OVERDUE",
  "UNASSIGNED_FOR_HOURS",
];

export const TRIGGER_LABEL: Record<EscalationTrigger, string> = {
  RESPONSE_OVERDUE: "Response overdue",
  RESOLUTION_OVERDUE: "Resolution overdue",
  UNASSIGNED_FOR_HOURS: "Unassigned for N hours",
};

export const ACTION_ORDER: EscalationAction[] = [
  "RAISE_PRIORITY",
  "NOTIFY_ADMIN",
];

export const ACTION_LABEL: Record<EscalationAction, string> = {
  RAISE_PRIORITY: "Raise priority",
  NOTIFY_ADMIN: "Notify an admin",
};

function optionalUuid(message: string) {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().uuid(message).nullable(),
  );
}

function optionalPriority(message: string) {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z
      .enum(PRIORITY_ORDER as [Priority, ...Priority[]], { message })
      .nullable(),
  );
}

export const escalationRuleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Please give the rule a short, recognizable name.")
      .max(120, "Please keep the name under 120 characters."),
    trigger: z.enum(TRIGGER_ORDER as [EscalationTrigger, ...EscalationTrigger[]], {
      message: "Please choose a trigger.",
    }),
    thresholdHours: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.coerce
        .number()
        .int("Please enter a whole number of hours.")
        .min(1, "Please enter at least 1 hour.")
        .nullable(),
    ),
    priorityFilter: optionalPriority("Please choose a valid priority."),
    departmentId: optionalUuid("Please choose a valid department."),
    action: z.enum(ACTION_ORDER as [EscalationAction, ...EscalationAction[]], {
      message: "Please choose an action.",
    }),
    targetPriority: optionalPriority("Please choose a valid priority."),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.trigger === "UNASSIGNED_FOR_HOURS" && data.thresholdHours == null) {
      ctx.addIssue({
        code: "custom",
        path: ["thresholdHours"],
        message: "Please enter the number of hours it must be unassigned.",
      });
    }
    if (data.action === "RAISE_PRIORITY" && !data.targetPriority) {
      ctx.addIssue({
        code: "custom",
        path: ["targetPriority"],
        message: "Please choose the priority to raise it to.",
      });
    }
  });

export type EscalationRuleInput = z.infer<typeof escalationRuleSchema>;

export function escalationRuleSentence(rule: {
  trigger: EscalationTrigger;
  thresholdHours: number | null;
  priorityFilter: Priority | null;
  action: EscalationAction;
  targetPriority: Priority | null;
  departmentName?: string | null;
}): string {
  let subject = "a complaint";
  if (rule.priorityFilter) {
    subject = `a ${PRIORITY_LABEL[rule.priorityFilter]} priority complaint`;
  }
  if (rule.departmentName) {
    subject += ` in ${rule.departmentName}`;
  }

  const triggerClause =
    rule.trigger === "RESPONSE_OVERDUE"
      ? "has an overdue response"
      : rule.trigger === "RESOLUTION_OVERDUE"
        ? "has an overdue resolution"
        : `is unassigned for ${rule.thresholdHours ?? 0} hours`;

  const actionClause =
    rule.action === "NOTIFY_ADMIN"
      ? "notify an admin"
      : rule.targetPriority
        ? `raise its priority to ${PRIORITY_LABEL[rule.targetPriority]}`
        : "raise its priority";

  return `When ${subject} ${triggerClause}, ${actionClause}.`;
}
