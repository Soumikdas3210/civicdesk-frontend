"use client";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";

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

export default function KitchenSinkPage() {
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
    </main>
  );
}