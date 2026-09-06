import Badge from "@/components/ui/Badge";
import { PRIORITY_LABEL, PRIORITY_TONE } from "@/lib/constants";
import type { Priority } from "@/lib/constants";

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}