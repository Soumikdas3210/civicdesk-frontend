import Link from "next/link";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const STEPS = [
  {
    n: "1",
    title: "Report it",
    body: "Tell us what is wrong and where. It takes about a minute and you do not need to know which department handles it.",
  },
  {
    n: "2",
    title: "Follow it",
    body: "An officer is assigned and replies in the thread. You get a tracking code and can check it whenever you like.",
  },
  {
    n: "3",
    title: "Rate it",
    body: "When it is marked as fixed you say whether it really was. If it was not, you can reopen it.",
  },
];

export default function LandingPage() {
  return (
    <>
      <PublicHeader />

      <main>
        <section className="mx-auto max-w-page px-6 py-16">
          <h1 className="max-w-[18ch] text-page-title">
            Report a problem in your neighbourhood.
          </h1>
          <p className="mt-4 max-w-[60ch] text-n-500">
            Street lights, drainage, roads and more. You get a tracking code and
            can follow it until it is fixed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center rounded-ctl bg-primary-600 px-5 text-body font-semibold text-white transition-colors duration-150 hover:bg-primary-700"
            >
              Report a problem
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-ctl border border-n-200 bg-surface px-5 text-body font-semibold text-primary-600 transition-colors duration-150 hover:border-primary-300 hover:bg-primary-50"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-n-200 bg-surface">
          <div className="mx-auto max-w-page px-6 py-16">
            <h2 className="mb-6 text-meta text-n-500">Three steps</h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="rounded-card border border-n-200 p-5"
                >
                  <span
                    className="mb-3 grid size-9 place-items-center rounded-full bg-primary-50 text-card-title text-primary-600"
                    aria-hidden="true"
                  >
                    {step.n}
                  </span>
                  <h3 className="mb-1.5 text-card-title">{step.title}</h3>
                  <p className="text-secondary text-n-500">{step.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-page px-6 py-16">
          <h2 className="text-section-title">Already reported something?</h2>
          <p className="mt-2 max-w-[60ch] text-n-500">
            Sign in and every complaint you have made is on one page, with its
            current status and everything an officer has said about it.
          </p>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}