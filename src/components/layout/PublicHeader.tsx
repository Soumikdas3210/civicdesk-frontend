import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="border-b border-n-200 bg-surface">
      <div className="mx-auto flex h-15 max-w-page items-center gap-3 px-6">
        <span className="text-card-title">
          <Link href="/">CivicDesk</Link>
        </span>
        <nav className="ml-auto flex items-center gap-1" aria-label="Main">
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center rounded-ctl px-3 text-secondary font-semibold text-n-700 hover:bg-n-100"
          >
            About
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-ctl px-3 text-secondary font-semibold text-primary-600 hover:bg-primary-50"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}