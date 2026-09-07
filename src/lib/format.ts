import { format, formatDistanceToNowStrict, isPast } from "date-fns";

export function formatDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, HH:mm");
}

export function relativeToNow(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function dueText(iso: string): string {
  const date = new Date(iso);
  return isPast(date)
    ? "Past the deadline"
    : `Due ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}