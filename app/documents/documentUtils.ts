import { OpportunitySource } from "@/constants/enums";
import type { LeadExecutionForm } from "./documentTypes";

export const sourceToEnum: Record<NonNullable<LeadExecutionForm["source"]>, number> = {
  Inbound: OpportunitySource.Inbound,
  Outbound: OpportunitySource.Outbound,
  Referral: OpportunitySource.Referral,
  Partner: OpportunitySource.Partner,
  RFP: OpportunitySource.Rfp,
};

export const splitName = (value?: string) => {
  if (!value) return { firstName: "", lastName: "" };
  const trimmed = value.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
};

export const getResponseItems = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "items" in value) {
    const withItems = value as { items?: unknown };
    if (Array.isArray(withItems.items)) return withItems.items as T[];
  }
  return [];
};

export const isLikelyTextContent = (fileName: string, contentType?: string) => {
  if (contentType?.startsWith("text/")) return true;
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm")
  );
};

export const decodeFileNameFromHeader = (
  contentDisposition: string | undefined,
  fallbackName: string
) => {
  const filenameFromHeader = contentDisposition?.match(
    /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i
  );
  return decodeURIComponent(filenameFromHeader?.[1] || filenameFromHeader?.[2] || fallbackName);
};

export const fetchJsonWithTimeout = async <T,>(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 25000
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T;
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
};

