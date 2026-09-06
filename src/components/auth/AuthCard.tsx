import Card from "@/components/ui/Card";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export default function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-[420px]">
        <h1 className="text-section-title">{title}</h1>
        <p className="mt-1 mb-6 text-secondary text-n-500">{description}</p>
        {children}
        <div className="mt-6 border-t border-n-200 pt-4 text-secondary text-n-500">
          {footer}
        </div>
      </Card>
    </main>
  );
}