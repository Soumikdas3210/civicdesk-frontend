"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useCategories } from "@/hooks/useTaxonomy";
import { useRecategorize } from "@/hooks/useGrievanceActions";
import { errorMessage } from "@/lib/errors";
import type { Grievance } from "@/lib/types";

export default function RecategorizePanel({
  grievance,
}: {
  grievance: Grievance;
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const { showToast } = useToast();
  const categories = useCategories();
  const recategorize = useRecategorize(grievance.id);

  const chosen = (categories.data ?? []).find((c) => c.id === categoryId);
  const movesDepartment =
    Boolean(chosen) && chosen?.departmentId !== grievance.category.departmentId;

  function run() {
    recategorize.mutate(categoryId, {
      onSuccess: () => {
        setOpen(false);
        setCategoryId("");
        showToast("The complaint has been moved", "success");
      },
      onError: (error) => showToast(errorMessage(error), "error"),
    });
  }

  return (
    <Card>
      <h3 className="mb-1 text-meta text-n-500">Category</h3>
      <p className="mb-3 text-secondary">
        {grievance.category.name}
        <span aria-hidden="true"> · </span>
        <span className="text-n-500">
          {grievance.category.department?.name ?? "Unknown department"}
        </span>
      </p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Move to a different category
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Move to a different category"
        description="Moving this to a different category also moves it to that category's department and recalculates the deadlines. The status does not change."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={recategorize.isPending}
              disabled={!categoryId}
              onClick={run}
            >
              Move complaint
            </Button>
          </>
        }
      >
        <Field label="New category" required>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categories.isLoading}
          >
            <option value="">Choose a category</option>
            {(categories.data ?? [])
              .filter((c) => c.isActive && c.id !== grievance.categoryId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>

        {movesDepartment && (
          <p className="rounded-ctl bg-primary-50 p-3 text-secondary text-primary-700">
            This moves the complaint to a different department. The officer
            handling it may no longer be eligible and will be unassigned.
          </p>
        )}
      </Modal>
    </Card>
  );
}