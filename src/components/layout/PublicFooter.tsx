import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-n-200 bg-surface">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-2 px-6 py-6 text-secondary text-n-500">
        <Link href="/about" className="font-semibold text-primary-600 underline">
          About
        </Link>
        <span aria-hidden="true">·</span>
        <span>Built for AIUB Advanced Web Technology</span>
      </div>
    </footer>
  );
}