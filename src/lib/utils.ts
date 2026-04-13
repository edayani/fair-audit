import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

/** Merge Tailwind classes safely (shadcn/ui standard) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date for display */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
}

/** Format a date with time */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

/** Relative time (e.g., "3 hours ago") */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Format currency */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Format percentage */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Convert enum-style string to human-readable */
export function humanize(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Truncate text */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/** Sleep utility for development */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Outcome color mapping for UI */
export function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case "APPROVED": return "text-green-600 bg-green-50 border-green-200";
    case "DENIED": return "text-red-600 bg-red-50 border-red-200";
    case "CONDITIONAL": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "PENDING_REVIEW": return "text-blue-600 bg-blue-50 border-blue-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

/** Severity color mapping */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "LOW": return "text-blue-600 bg-blue-50";
    case "MEDIUM": return "text-yellow-600 bg-yellow-50";
    case "HIGH": return "text-orange-600 bg-orange-50";
    case "CRITICAL": return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}
