import { cn } from "@/lib/cn";

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-n-200">
      <table
        className={cn(
          "w-full border-collapse bg-surface text-secondary",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr className={cn("border-b border-n-200 last:border-b-0", className)}>
      {children}
    </tr>
  );
}

export function TH({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-n-200 bg-n-100 px-3.5 py-2.5 text-left text-meta text-n-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td className={cn("px-3.5 py-3.5 align-middle", className)}>{children}</td>
  );
}