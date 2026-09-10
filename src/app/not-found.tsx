import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-form px-6 py-24 text-center">
      <h1 className="text-section-title">We could not find that page</h1>
      <p className="mx-auto mt-2 max-w-[50ch] text-n-500">
        The link may be wrong, or the page may have been moved. If you were
        looking for a complaint, sign in and search for its tracking code.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-ctl bg-primary-600 px-5 text-body font-semibold text-white hover:bg-primary-700"
        >
          Go to the home page
        </Link>
        <Link
          href="/grievances"
          className="inline-flex min-h-11 items-center rounded-ctl border border-n-200 bg-surface px-5 text-body font-semibold text-primary-600 hover:border-primary-300 hover:bg-primary-50"
        >
          My complaints
        </Link>
      </div>
    </main>
  );
}