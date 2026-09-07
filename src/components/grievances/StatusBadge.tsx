import Badge from "@/components/ui/Badge";
import { STATUS_TONE, statusLabel } from "@/lib/constants";
import type { GrievanceStatus } from "@/lib/constants";
import type { Role } from "@/lib/roles";

export default function StatusBadge({
  status,
  role,
}: {
  status: GrievanceStatus;
  role: Role;
}) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {statusLabel(status, role)}
    </Badge>
  );
}