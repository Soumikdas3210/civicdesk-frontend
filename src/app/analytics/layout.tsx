import AppShell from "@/components/layout/AppShell";
import AdminGuard from "@/components/admin/AdminGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AdminGuard>{children}</AdminGuard>
    </AppShell>
  );
}
