"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-form px-6 py-24 text-center">
      <h1 className="text-section-title">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-[50ch] text-n-500">
        This is our fault, not yours. Try again, and if it keeps happening go
        back to the home page.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-ctl bg-primary-600 px-5 text-body font-semibold text-white hover:bg-primary-700"
        >
          Try again
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full page load is intended. This boundary catches render failures, and the router may be part of what failed, so client-side navigation cannot be relied on to escape. */}
        <a
          href="/"
          className="inline-flex min-h-11 items-center rounded-ctl border border-n-200 bg-surface px-5 text-body font-semibold text-primary-600 hover:border-primary-300 hover:bg-primary-50"
          >
          Go to the home page
        </a>
      </div>
    </main>
  );
}