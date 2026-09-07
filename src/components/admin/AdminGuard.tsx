"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Gates the admin area to admins only. Non-admins see a plain permission
 * message instead of the page. This is a convenience layer: the backend still
 * returns 403 on every admin endpoint, which is the real enforcement.
 */
export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <Spinner label="Loading" />;
  }

  if (!user || user.role !== "admin") {
    return (
      <EmptyState
        title="You do not have permission to view this area"
        description="This section is for administrators. If you think this is a mistake, ask your system administrator to check your account."
        action={
          <Button onClick={() => router.push("/grievances")}>
            Go to complaints
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
