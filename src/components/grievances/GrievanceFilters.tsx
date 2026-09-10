"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useCategories,
  useDepartments,
  useTags,
  useWards,
} from "@/hooks/useTaxonomy";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_ORDER,
  statusLabel,
} from "@/lib/constants";
import type { Role } from "@/lib/roles";

export type Filters = {
  status: string;
  priority: string;
  categoryId: string;
  departmentId: string;
  wardId: string;
  tagId: string;
  search: string;
};

export const EMPTY_FILTERS: Filters = {
  status: "",
  priority: "",
  categoryId: "",
  departmentId: "",
  wardId: "",
  tagId: "",
  search: "",
};

export default function GrievanceFilters({
  filters,
  role,
  onChange,
}: {
  filters: Filters;
  role: Role;
  onChange: (next: Filters) => void;
}) {
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebounce(search);

  const categories = useCategories();
  const wards = useWards();
  const departments = useDepartments();
  const tags = useTags();

  useEffect(() => {
    if (debounced !== filters.search) {
      onChange({ ...filters, search: debounced });
    }
  }, [debounced, filters, onChange]);

  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const isStaff = role !== "citizen";
  const active = Object.entries(filters).filter(([, v]) => v !== "").length;

  return (
    <div className="mb-6 rounded-card border border-n-200 bg-surface p-4">
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Search">
          <Input
            type="search"
            placeholder="Title, description or tracking code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>

        <Field label="Status">
          <Select value={filters.status} onChange={(e) => set("status", e.target.value)}>
            <option value="">Any status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s, role)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Priority">
          <Select value={filters.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="">Any priority</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Category">
          <Select
            value={filters.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            disabled={categories.isLoading}
          >
            <option value="">Any category</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        {isStaff && (
          <Field label="Ward">
            <Select
              value={filters.wardId}
              onChange={(e) => set("wardId", e.target.value)}
              disabled={wards.isLoading}
            >
              <option value="">Any ward</option>
              {(wards.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {role === "admin" && (
          <Field label="Department">
            <Select
              value={filters.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
              disabled={departments.isLoading}
            >
              <option value="">Any department</option>
              {(departments.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {isStaff && (
          <Field label="Tag">
            <Select
              value={filters.tagId}
              onChange={(e) => set("tagId", e.target.value)}
              disabled={tags.isLoading}
            >
              <option value="">Any tag</option>
              {(tags.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {active > 0 && (
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            onChange(EMPTY_FILTERS);
          }}
        >
          Clear {active} {active === 1 ? "filter" : "filters"}
        </Button>
      )}
    </div>
  );
}