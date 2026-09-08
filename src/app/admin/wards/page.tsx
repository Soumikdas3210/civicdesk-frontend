"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import WardForm from "@/components/admin/WardForm";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useWards } from "@/hooks/useTaxonomy";
import { errorMessage } from "@/lib/errors";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import type { Ward } from "@/lib/types";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; ward: Ward }
  | null;

const FORM_ID = "ward-form";

export default function WardsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const wards = useWards();

  const [modal, setModal] = useState<ModalState>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setFormError(null);
    setModal({ mode: "create" });
  }

  function openEdit(ward: Ward) {
    setFormError(null);
    setModal({ mode: "edit", ward });
  }

  const saveMutation = useMutation({
    mutationFn: async (input: { name: string; code: string }) => {
      if (modal?.mode === "edit") {
        return (await http.patch<Ward>(`/wards/${modal.ward.id}`, input)).data;
      }
      return (await http.post<Ward>("/wards", input)).data;
    },
    onSuccess: () => {
      const wasEdit = modal?.mode === "edit";
      void queryClient.invalidateQueries({ queryKey: qk.wards });
      showToast(wasEdit ? "Changes saved." : "Ward added.", "success");
      setModal(null);
    },
    onError: (error, input) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError(`A ward with code ${input.code} already exists.`);
        return;
      }
      setFormError(errorMessage(error));
    },
  });

  const list = wards.data ?? [];

  return (
    <>
      <PageHeader
        title="Wards"
        description={
          wards.data
            ? `${list.length} ward${list.length === 1 ? "" : "s"}. Complaints are assigned to a ward when they are filed.`
            : "Complaints are assigned to a ward when they are filed."
        }
        action={<Button onClick={openCreate}>Add ward</Button>}
      />

      {wards.isLoading && <Spinner label="Loading wards" />}

      {wards.isError && (
        <ErrorState
          message={errorMessage(wards.error)}
          action={
            <Button variant="secondary" onClick={() => void wards.refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {wards.data && list.length === 0 && (
        <EmptyState
          title="No wards yet"
          description="Add the first ward. Complaints are then assigned to it when they are filed."
          action={<Button onClick={openCreate}>Add ward</Button>}
        />
      )}

      {wards.data && list.length > 0 && (
        <>
          <p className="mb-3 text-secondary text-n-500">
            Wards cannot be deleted because complaints are linked to them.
          </p>
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH className="text-right">
                  <span className="sr-only">Actions</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {list.map((ward) => (
                <TR key={ward.id}>
                  <TD className="font-semibold text-n-900">{ward.name}</TD>
                  <TD className="text-n-500">{ward.code}</TD>
                  <TD className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" onClick={() => openEdit(ward)}>
                        Edit
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit ward" : "Add ward"}
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
              {modal?.mode === "edit" ? "Save changes" : "Add ward"}
            </Button>
          </>
        }
      >
        {modal && (
          <WardForm
            key={modal.mode === "edit" ? modal.ward.id : "create"}
            formId={FORM_ID}
            initial={
              modal.mode === "edit"
                ? { name: modal.ward.name, code: modal.ward.code }
                : { name: "", code: "" }
            }
            serverError={formError}
            onValidSubmit={(values) => saveMutation.mutate(values)}
          />
        )}
      </Modal>
    </>
  );
}
