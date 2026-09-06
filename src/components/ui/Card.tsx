import { cn } from "@/lib/cn";

type CardProps = {
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function Card({
  padded = true,
  className,
  children,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-n-200 bg-surface",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}