"use client";

import { useId } from "react";
import Select from "@/components/ui/Select";
import { useCannedResponses } from "@/hooks/useCannedResponses";

/**
 * A dropdown beside the reply box. Choosing a template inserts its body into
 * the textarea via onSelect so the officer can edit it before sending. It has
 * no apply endpoint on purpose: sending is the reply box's job, and a second
 * write path into messages would let a template bypass officer review.
 */
export default function CannedResponsePicker({
  onSelect,
}: {
  onSelect: (body: string) => void;
}) {
  const { data, isLoading, isError } = useCannedResponses();
  const selectId = useId();
  const templates = data ?? [];

  if (isError || (!isLoading && templates.length === 0)) return null;

  return (
    <div className="w-full sm:w-64">
      <label htmlFor={selectId} className="sr-only">
        Insert a canned response
      </label>
      <Select
        id={selectId}
        value=""
        disabled={isLoading}
        onChange={(e) => {
          const template = templates.find((t) => t.id === e.target.value);
          if (template) onSelect(template.body);
        }}
      >
        <option value="" disabled>
          {isLoading ? "Loading templates…" : "Insert a canned response"}
        </option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </Select>
    </div>
  );
}
