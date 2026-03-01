import type {
  SetupPlan,
  SetupPlanActivity,
  SetupPlanClient,
  SetupPlanContact,
  SetupPlanNote,
  SetupPlanOpportunity,
  SetupPlanPricingRequest,
} from "@/types/setupPlan";

const allowedStages = new Set([1, 2, 3, 4, 5, 6]);
const allowedSources = new Set([1, 2, 3, 4, 5]);
const allowedPriorities = new Set([1, 2, 3, 4]);
const allowedClientTypes = new Set([1, 2, 3]);
const allowedActivityTypes = new Set([1, 2, 3, 4, 5, 6]);

const safeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toDateOnly = (value: unknown) => {
  const text = safeString(value);
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

const toIsoDateTime = (value: unknown) => {
  const text = safeString(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const normalizeClient = (value: unknown): SetupPlanClient | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = safeString(record.name);
  if (!name) return null;

  const clientType = toNumber(record.clientType);
  return {
    name,
    industry: safeString(record.industry) || undefined,
    clientType: clientType && allowedClientTypes.has(clientType) ? (clientType as 1 | 2 | 3) : undefined,
    website: safeString(record.website) || undefined,
    billingAddress: safeString(record.billingAddress) || undefined,
    taxNumber: safeString(record.taxNumber) || undefined,
    companySize: safeString(record.companySize) || undefined,
  };
};

const normalizeContact = (value: unknown): SetupPlanContact | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const firstName = safeString(record.firstName);
  const lastName = safeString(record.lastName);
  if (!firstName && !lastName) return null;
  return {
    firstName: firstName || "Contact",
    lastName: lastName || "Unknown",
    email: safeString(record.email) || undefined,
    phoneNumber: safeString(record.phoneNumber) || undefined,
    position: safeString(record.position) || undefined,
    isPrimaryContact: typeof record.isPrimaryContact === "boolean" ? record.isPrimaryContact : undefined,
  };
};

const normalizeOpportunity = (value: unknown): SetupPlanOpportunity | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = safeString(record.title);
  if (!title) return null;

  const stage = toNumber(record.stage);
  const source = toNumber(record.source);
  const probability = toNumber(record.probability);
  return {
    title,
    clientId: safeString(record.clientId) || undefined,
    contactMatch:
      record.contactMatch && typeof record.contactMatch === "object"
        ? {
            email: safeString((record.contactMatch as Record<string, unknown>).email) || undefined,
            fullName: safeString((record.contactMatch as Record<string, unknown>).fullName) || undefined,
          }
        : undefined,
    estimatedValue: toNumber(record.estimatedValue),
    currency: safeString(record.currency) || "ZAR",
    stage: stage && allowedStages.has(stage) ? (stage as 1 | 2 | 3 | 4 | 5 | 6) : 1,
    source: source && allowedSources.has(source) ? (source as 1 | 2 | 3 | 4 | 5) : undefined,
    probability: probability ?? 30,
    expectedCloseDate: toDateOnly(record.expectedCloseDate),
    description: safeString(record.description) || undefined,
  };
};

const normalizeActivity = (value: unknown): SetupPlanActivity | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const type = toNumber(record.type);
  const subject = safeString(record.subject);
  if (!type || !allowedActivityTypes.has(type) || !subject) return null;
  const priority = toNumber(record.priority);
  const hint = safeString(record.assignToRoleHint);
  return {
    type: type as 1 | 2 | 3 | 4 | 5 | 6,
    subject,
    description: safeString(record.description) || undefined,
    priority: priority && allowedPriorities.has(priority) ? (priority as 1 | 2 | 3 | 4) : 2,
    dueDate: toIsoDateTime(record.dueDate),
    duration: toNumber(record.duration),
    location: safeString(record.location) || undefined,
    assignToRoleHint:
      hint === "Admin" ||
      hint === "SalesManager" ||
      hint === "BusinessDevelopmentManager" ||
      hint === "SalesRep"
        ? hint
        : null,
  };
};

const normalizePricingRequest = (value: unknown): SetupPlanPricingRequest | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = safeString(record.title);
  if (!title) return null;
  const priority = toNumber(record.priority);
  const hint = safeString(record.assignToRoleHint);
  return {
    title,
    description: safeString(record.description) || undefined,
    priority: priority && allowedPriorities.has(priority) ? (priority as 1 | 2 | 3 | 4) : undefined,
    requiredByDate: toDateOnly(record.requiredByDate),
    assignToRoleHint:
      hint === "SalesManager" || hint === "BusinessDevelopmentManager"
        ? hint
        : null,
  };
};

const normalizeNote = (value: unknown): SetupPlanNote | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const content = safeString(record.content);
  if (!content) return null;
  const related = safeString(record.relatedTo);
  return {
    content,
    isPrivate: typeof record.isPrivate === "boolean" ? record.isPrivate : false,
    relatedTo: related === "Opportunity" ? "Opportunity" : "Client",
  };
};

export const normalizeSetupPlan = (value: unknown): SetupPlan => {
  const record =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    client: normalizeClient(record.client),
    contacts: Array.isArray(record.contacts)
      ? record.contacts.map(normalizeContact).filter((item): item is SetupPlanContact => !!item)
      : [],
    opportunity: normalizeOpportunity(record.opportunity),
    activities: Array.isArray(record.activities)
      ? record.activities
          .map(normalizeActivity)
          .filter((item): item is SetupPlanActivity => !!item)
      : [],
    pricingRequest: normalizePricingRequest(record.pricingRequest),
    notes: Array.isArray(record.notes)
      ? record.notes.map(normalizeNote).filter((item): item is SetupPlanNote => !!item)
      : [],
  };
};

export const isSetupPlanLike = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    "client" in record &&
    "contacts" in record &&
    "opportunity" in record &&
    "activities" in record &&
    "pricingRequest" in record &&
    "notes" in record
  );
};
