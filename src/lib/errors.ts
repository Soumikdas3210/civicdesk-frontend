import axios from "axios";
import type { ZodError } from "zod";

const BY_STATUS: Record<number, string> = {
  401: "Your session has ended. Please sign in again.",
  403: "You do not have permission to do this.",
  404: "We could not find that. It may have been removed.",
  413: "That file is too large. The limit is 5MB.",
  415: "That file type is not allowed. Use a photo or a PDF.",
  422: "Please check the highlighted fields.",
  500: "Something went wrong on our side. Please try again in a moment.",
};

function serverMessages(error: unknown): string[] {
  if (!axios.isAxiosError(error)) return [];
  const message = error.response?.data?.message;
  if (typeof message === "string") return [message];
  if (Array.isArray(message)) {
    return message.filter((m): m is string => typeof m === "string");
  }
  return [];
}

function sentence(text: string): string {
  const trimmed = text.trim();
  const capped = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

export function errorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again in a moment.";
  }

  if (!error.response) {
    return "We could not reach the server. Check that it is running and try again.";
  }

  const status = error.response.status;

  if (status === 400 || status === 409) {
    const list = serverMessages(error);
    if (list.length > 0) return sentence(list[0]);
  }

  return BY_STATUS[status] ?? "Something went wrong. Please try again in a moment.";
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const status = error.response?.status;
  if (status !== 400 && status !== 422) return {};

  const out: Record<string, string> = {};
  for (const raw of serverMessages(error)) {
    const field = raw.split(" ")[0];
    if (field && !out[field]) out[field] = sentence(raw);
  }
  return out;
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}