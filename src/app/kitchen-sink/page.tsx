"use client";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import GrievanceCard from "@/components/grievances/GrievanceCard";
import TrackingCode from "@/components/grievances/TrackingCode";
import type { Grievance } from "@/lib/types";

const PRIMARY = [
  ["--primary-50", "selected row, information panel"],
  ["--primary-100", "badge fill"],
  ["--primary-200", "disabled primary button"],
  ["--primary-300", "chart series"],
  ["--primary-400", "chart series, focus ring"],
  ["--primary-500", "link on a tinted background"],
  ["--primary-600", "base. buttons, active nav, links"],
  ["--primary-700", "hover"],
  ["--primary-800", "pressed"],
  ["--primary-900", "deep headers, rare"],
];

const NEUTRAL = [
  ["--n-50", "canvas"],
  ["--n-100", "table header, hover row"],
  ["--n-200", "every border and divider"],
  ["--n-300", "placeholder, disabled text"],
  ["--n-400", "icons"],
  ["--n-500", "secondary text and meta"],
  ["--n-700", "headings on tinted panels"],
  ["--n-900", "body text"],
  ["--surface", "cards, inputs, panels"],
];

const SEMANTIC = [
  ["Open", "--open", "--open-t"],
  ["In progress", "--progress", "--progress-t"],
  ["Waiting for your reply", "--waiting", "--waiting-t"],
  ["Resolved", "--resolved", "--resolved-t"],
  ["Reopened", "--reopened", "--reopened-t"],
  ["Closed", "--closed", "--closed-t"],
  ["Error and destructive", "--danger", "--danger-t"],
];

const TYPE = [
  ["Page title, 34 / 40, 700", "text-page-title"],
  ["Section title, 26 / 32, 700", "text-section-title"],
  ["Card title, 21 / 28, 600", "text-card-title"],
  ["Body, 17 / 27, 400", "text-body"],
  ["Secondary, 15 / 22, 400", "text-secondary"],
  ["Label and meta, 13 / 18, 600", "text-meta"],
];

const WARD = { id: "w1", name: "Ward 7, Tejgaon", code: "W-07" };

const CATEGORY = {
  id: "c1",
  name: "Street lighting",
  description: null,
  isActive: true,
  departmentId: "d1",
  department: { id: "d1", name: "Public Works", description: null },
};

function fixture(over: Partial<Grievance>): Grievance {
  return {
    id: "g1",
    trackingCode: "GRV-2026-000005",
    title: "Street light not working on Road 12",
    description: "The light outside house 42 has been off for two weeks.",
    status: "OPEN",
    priority: "MEDIUM",
    citizenId: "u1",
    assignedOfficerId: null,
    category: CATEGORY,
    categoryId: "c1",
    ward: WARD,
    wardId: "w1",
    responseDueAt: "2026-09-20T00:00:00.000Z",
    resolutionDueAt: "2026-09-20T00:00:00.000Z",
    firstRespondedAt: null,
    resolvedAt: null,
    waitingSince: null,
    pausedMs: "0",
    responseBreached: false,
    resolutionBreached: false,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    tags: [],
    ...over,
  };
}

const CARDS: Grievance[] = [
  fixture({}),
  fixture({
    id: "g2",
    trackingCode: "GRV-2026-000006",
    title: "Overflowing drain beside the school gate",
    status: "IN_PROGRESS",
    priority: "URGENT",
    resolutionBreached: true,
  }),
  fixture({
    id: "g3",
    trackingCode: "GRV-2026-000007",
    title: "Broken footpath slab near the mosque",
    status: "WAITING_ON_CITIZEN",
    priority: "LOW",
    waitingSince: "2026-09-03T00:00:00.000Z",
  }),
  fixture({
    id: "g4",
    trackingCode: "GRV-2026-000008",
    title: "Pothole outside the community clinic",
    status: "RESOLVED",
    priority: "HIGH",
    resolvedAt: "2026-08-30T00:00:00.000Z",
  }),
  fixture({
    id: "g5",
    trackingCode: "GRV-2026-000009",
    title:
      "The streetlight at the corner of the market road has been flickering every night for the past three weeks and it is now completely dark",
    status: "REOPENED",
    priority: "MEDIUM",
  }),
  fixture({
    id: "g6",
    trackingCode: "GRV-2026-000010",
    title: "Illegal parking blocking the alley",
    status: "CLOSED",
    priority: "LOW",
    updatedAt: "2026-08-12T00:00:00.000Z",
  }),
];

function Swatch({ token, use }: { token: string; use: string }) {
  return (
    <div className="overflow-hidden rounded-card border border-n-200 bg-surface">
      <div className="h-16" style={{ background: `var(${token})` }} />
      <div className="p-2">
        <p className="text-meta text-n-900">{token}</p>
        <p className="text-meta font-normal text-n-500">{use}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-n-200 py-12">
      <h2 className="mb-6 text-section-title">{title}</h2>
      {children}
    </section>
  );
}

function KitchenSink() {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <main className="mx-auto max-w-page px-6 py-12">
      <h1 className="text-page-title">Kitchen sink</h1>
      <p className="mt-2 max-w-form text-n-500">
        Every token and primitive in every state. This page is deleted at T1.8.
        It is the only file allowed to reference a token variable directly.
      </p>

      <Section title="Primary ramp, hue 211">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {PRIMARY.map(([token, use]) => (
            <Swatch key={token} token={token} use={use} />
          ))}
        </div>
      </Section>

      <Section title="Neutral ramp, hue 211 desaturated">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {NEUTRAL.map(([token, use]) => (
            <Swatch key={token} token={token} use={use} />
          ))}
        </div>
      </Section>

      <Section title="Semantic palette">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {SEMANTIC.map(([label, text, tint]) => (
            <div
              key={label}
              className="rounded-card border border-n-200 p-4"
              style={{ background: `var(${tint})` }}
            >
              <p
                className="text-card-title"
                style={{ color: `var(${text})` }}
              >
                {label}
              </p>
              <p className="text-meta font-normal" style={{ color: `var(${text})` }}>
                {text} on {tint}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-form text-secondary text-n-500">
          Take a greyscale screenshot of this block. If every label is still
          readable, the palette passes the colour vision check.
        </p>
      </Section>

      <Section title="Type scale">
        {TYPE.map(([label, cls]) => (
          <div
            key={cls}
            className="flex flex-wrap items-baseline gap-6 border-b border-n-200 py-3"
          >
            <span className="w-48 shrink-0 text-meta text-n-500">{label}</span>
            <span className={cls}>Report a problem in your neighbourhood</span>
          </div>
        ))}
      </Section>

            <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Submit complaint</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="danger">Delete department</Button>
          <Button variant="ghost">Clear filters</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button loading>Submit complaint</Button>
          <Button variant="secondary" loading>
            Cancel
          </Button>
          <Button disabled>Submit complaint</Button>
          <Button variant="secondary" disabled>
            Cancel
          </Button>
          <Button variant="danger" disabled>
            Delete department
          </Button>
          <Button variant="ghost" disabled>
            Clear filters
          </Button>
        </div>
        <p className="mt-4 max-w-form text-secondary text-n-500">
          Every button is at least 44px tall. Labels say what happens, never OK
          or Submit.
        </p>
      </Section>

      <Section title="Form fields">
        <div className="max-w-form">
          <Field
            label="Title"
            help="A short summary an officer can scan in a list."
            required
          >
            <Input placeholder="Street light out on Bijoy Sarani" />
          </Field>

          <Field
            label="Title"
            help="A short summary an officer can scan in a list."
            error="Please make the title at least 5 characters so officers can find it."
            required
          >
            <Input defaultValue="Bro" />
          </Field>

          <Field label="Ward" required>
            <Select defaultValue="">
              <option value="" disabled>
                Choose a ward
              </option>
              <option>Ward 12, Tejgaon</option>
              <option>Ward 19, Gulshan</option>
            </Select>
          </Field>

          <Field
            label="Ward"
            error="Please choose the ward where the problem is."
            required
          >
            <Select defaultValue="">
              <option value="" disabled>
                Choose a ward
              </option>
            </Select>
          </Field>

          <Field
            label="Description"
            help="What is wrong, where exactly, and how long it has been like that."
            required
          >
            <Textarea placeholder="The light outside house 42 has been off for two weeks." />
          </Field>

          <Field label="Tracking code">
            <Input defaultValue="CD-2026-0912-4471" disabled />
          </Field>
        </div>
      </Section>

      <Section title="Loading">
        <div className="rounded-card border border-n-200 bg-surface">
          <Spinner label="Loading complaints" />
        </div>
      </Section>

            <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="open" dot>
            Open
          </Badge>
          <Badge tone="progress" dot>
            In progress
          </Badge>
          <Badge tone="waiting" dot>
            Waiting for your reply
          </Badge>
          <Badge tone="resolved" dot>
            Resolved
          </Badge>
          <Badge tone="reopened" dot>
            Reopened
          </Badge>
          <Badge tone="closed" dot>
            Closed
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone="closed">Low</Badge>
          <Badge tone="open">Medium</Badge>
          <Badge tone="progress">High</Badge>
          <Badge tone="danger">Urgent</Badge>
        </div>
      </Section>

      <Section title="Card and table">
        <Card className="mb-6 max-w-form">
          <h3 className="text-card-title">Officer handling this</h3>
          <p className="mt-1 text-secondary text-n-500">
            Karim Ahmed, Public Works, Ward 12
          </p>
        </Card>

        <Table>
          <THead>
            <TR>
              <TH>Category</TH>
              <TH>Department</TH>
              <TH>Status</TH>
              <TH>Complaints</TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD>Street lighting</TD>
              <TD>Public Works</TD>
              <TD>
                <Badge tone="resolved">Active</Badge>
              </TD>
              <TD>34</TD>
            </TR>
            <TR>
              <TD>Illegal parking</TD>
              <TD>Traffic</TD>
              <TD>
                <Badge tone="closed">Retired</Badge>
              </TD>
              <TD>9</TD>
            </TR>
          </TBody>
        </Table>

        <Pagination page={page} limit={20} total={137} onPageChange={setPage} />
      </Section>

      <Section title="Empty and error states">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            title="No complaints yet"
            description="When you report a problem it will appear here with a tracking code."
            action={<Button>Report a problem</Button>}
          />
          <ErrorState
            message="We could not reach the server. Check that it is running and try again."
            action={<Button variant="secondary">Try again</Button>}
          />
        </div>
      </Section>

      <Section title="Modal, confirmation and toast">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setModalOpen(true)}>Open a modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete department
          </Button>
          <Button
            variant="secondary"
            onClick={() => showToast("Your reply has been sent", "success")}
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              showToast("We could not save that. Please try again.", "error")
            }
          >
            Error toast
          </Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Move to a different category"
          description="This also moves the complaint to that category's department and recalculates the deadlines."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Save change</Button>
            </>
          }
        >
          <Field label="Category" required>
            <Select defaultValue="">
              <option value="" disabled>
                Choose a category
              </option>
              <option>Street lighting</option>
              <option>Drainage</option>
            </Select>
          </Field>
        </Modal>

        <ConfirmDialog
          open={confirmOpen}
          title="Delete Public Works?"
          description="This department has 3 officers and 41 complaints. This cannot be undone."
          confirmLabel="Delete department"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
        />
      </Section>

      <Section title="Shape and focus">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-card border border-n-200 bg-surface p-4 text-secondary">
            rounded-card, 8px
          </div>
          <div className="rounded-ctl border border-n-200 bg-surface p-4 text-secondary">
            rounded-ctl, 6px
          </div>
          <span className="rounded-full bg-primary-100 px-3 py-1 text-meta text-primary-600">
            rounded-full, badges only
          </span>
          <button className="rounded-ctl border border-n-200 bg-surface px-4 py-3 text-body">
            Tab to me to see the focus ring
          </button>
        </div>
      </Section>

            <Section title="Tracking code">
        <div className="flex flex-wrap items-center gap-6">
          <TrackingCode code="GRV-2026-000005" />
          <TrackingCode code="GRV-2026-000005" size="lg" />
        </div>
        <p className="mt-4 max-w-form text-secondary text-n-500">
          The signature element. Dashed border so it reads as a reference
          number rather than a label. The large size is used once, on the
          confirmation screen after submitting.
        </p>
      </Section>

      <Section title="Grievance card, citizen view">
        <div className="flex flex-col gap-3">
          {CARDS.map((g) => (
            <GrievanceCard key={g.id} grievance={g} role="citizen" />
          ))}
        </div>
      </Section>

      <Section title="Grievance card, officer view">
        <div className="flex flex-col gap-3">
          {CARDS.slice(2, 4).map((g) => (
            <GrievanceCard key={g.id} grievance={g} role="officer" />
          ))}
        </div>
        <p className="mt-4 max-w-form text-secondary text-n-500">
          Same component. The waiting status reads &ldquo;Waiting on
          citizen&rdquo; to staff and &ldquo;Waiting for your reply&rdquo; to
          the person who filed it.
        </p>
      </Section>
    </main>
  ); 
}

export default function KitchenSinkPage() {
  return (
    <ToastProvider>
      <KitchenSink />
    </ToastProvider>
  );
}
