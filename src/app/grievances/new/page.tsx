"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import CopyButton from "@/components/grievances/CopyButton";
import TrackingCode from "@/components/grievances/TrackingCode";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCategories, useDepartments, useWards } from "@/hooks/useTaxonomy";
import { errorMessage, fieldErrors, zodFieldErrors } from "@/lib/errors";
import { http } from "@/lib/http";
import { createGrievanceSchema } from "@/lib/schemas/grievance";
import type { Grievance } from "@/lib/types";

type FormKey = "title" | "description" | "categoryId" | "wardId";

const BLANK = {
  title: "",
  description: "",
  categoryId: "",
  wardId: "",
};

export default function NewGrievancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  const categories = useCategories();
  const wards = useWards();
  const departments = useDepartments();

  const [values, setValues] = useState(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<Grievance | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: unknown) => {
      const res = await http.post<Grievance>("/grievances", input);
      return res.data;
    },
    onSuccess: (grievance) => {
      void queryClient.invalidateQueries({ queryKey: ["grievances"] });
      setCreated(grievance);
    },
    onError: (error) => {
      const fields = fieldErrors(error);
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(errorMessage(error));
    },
  });

  function update(key: FormKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function handleSubmit() {
    setFormError(null);

    const parsed = createGrievanceSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    mutation.mutate(parsed.data);
  }

  if (userLoading) return <Spinner label="Loading" />;

  if (user && user.role !== "citizen") {
    return (
      <EmptyState
        title="This form is for citizens"
        description="Complaints are filed by the people affected by them. You can see everything reported in your area in the work queue."
        action={
          <Button onClick={() => router.push("/grievances")}>
            Go to the work queue
          </Button>
        }
      />
    );
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-form text-center">
        <div
          className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-resolved-tint text-resolved"
          aria-hidden="true"
        >
          <Check className="size-7" />
        </div>

        <h2 className="text-section-title">Your complaint has been received</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-n-500">
          Keep this tracking code. You can use it to find your complaint and to
          quote it if you contact the council by phone.
        </p>

        <div className="my-6 flex flex-col items-center gap-3">
          <TrackingCode code={created.trackingCode} size="lg" />
          <CopyButton value={created.trackingCode} />
        </div>

        <p className="text-secondary text-n-500">
          It has gone to {created.category.name} in{" "}
          {created.category.department?.name ?? "the responsible department"}.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push(`/grievances/${created.id}`)}>
            View my complaint
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setCreated(null);
              setValues(BLANK);
            }}
          >
            Report another problem
          </Button>
        </div>
      </Card>
    );
  }

  const chosen = (categories.data ?? []).find((c) => c.id === values.categoryId);
  const routedTo =
    chosen?.department?.name ??
    (departments.data ?? []).find((d) => d.id === chosen?.departmentId)?.name;

  return (
    <>
      <PageHeader
        title="Report a problem"
        description="Tell us what is wrong and where. You will get a tracking code you can follow."
      />

      <div className="max-w-form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <Field
            label="Title"
            help="A short summary an officer can scan in a list."
            error={errors.title}
            required
          >
            <Input
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Street light out on Road 12"
            />
          </Field>

          <Field
            label="Description"
            help="What is wrong, where exactly, and how long it has been like that."
            error={errors.description}
            required
          >
            <Textarea
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="The light outside house 42 has been off for two weeks. The whole street is dark after 7pm."
            />
          </Field>

          <Field
            label="Category"
            help="Choose the closest match. An officer can move it if needed."
            error={errors.categoryId}
            required
          >
            <Select
              value={values.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              disabled={categories.isLoading}
            >
              <option value="">Choose a category</option>
              {(categories.data ?? [])
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>

          {routedTo && (
            <p className="-mt-4 mb-6 rounded-ctl bg-primary-50 p-3 text-secondary text-primary-700">
              This will go to {routedTo}.
            </p>
          )}

          <Field
            label="Ward"
            help="The area where the problem is, not where you live."
            error={errors.wardId}
            required
          >
            <Select
              value={values.wardId}
              onChange={(e) => update("wardId", e.target.value)}
              disabled={wards.isLoading}
            >
              <option value="">Choose a ward</option>
              {(wards.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>

          {formError && (
            <p
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-ctl border border-danger bg-danger-tint p-3 text-secondary font-semibold text-danger"
            >
              <span aria-hidden="true">!</span>
              <span>{formError}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={mutation.isPending}>
              Submit complaint
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/grievances")}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}