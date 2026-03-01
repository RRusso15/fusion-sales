"use client";

import { RelatedToType } from "@/constants/enums";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { removeAuthCookie } from "@/utils/cookie";
import { normalizeSetupPlan } from "@/services/ai/setupPlanUtils";
import type { SetupPlan } from "@/types/setupPlan";

export interface ExecutionStepResult {
  key: string;
  label: string;
  status: "success" | "failed" | "skipped";
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  steps: ExecutionStepResult[];
  warnings: string[];
  created: {
    clientId?: string;
    contactIds: string[];
    opportunityId?: string;
    activityIds: string[];
    pricingRequestId?: string;
    noteIds: string[];
    documentId?: string;
  };
  links: Array<{ label: string; href: string }>;
}

interface ExecuteOptions {
  existingClientId?: string;
  currentUserId?: string;
  originalFile?: File | null;
  rawText?: string;
}

const getErrorStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
  (error as Error)?.message ??
  fallback;

const normalizeName = (value?: string) => (value ?? "").trim().toLowerCase();

const resolveContactIdByMatch = (
  contactIds: Array<{ id: string; email?: string; fullName?: string }>,
  match?: { email?: string; fullName?: string }
) => {
  if (!match) return undefined;
  const byEmail = match.email
    ? contactIds.find((entry) => normalizeName(entry.email) === normalizeName(match.email))
    : undefined;
  if (byEmail?.id) return byEmail.id;

  const byName = match.fullName
    ? contactIds.find((entry) => normalizeName(entry.fullName) === normalizeName(match.fullName))
    : undefined;
  return byName?.id;
};

export async function executeSetupPlan(
  inputPlan: SetupPlan,
  options: ExecuteOptions = {}
): Promise<ExecutionResult> {
  const axios = getAxiosInstance();
  const plan = normalizeSetupPlan(inputPlan);
  const steps: ExecutionStepResult[] = [];
  const warnings: string[] = [];
  const created = {
    clientId: options.existingClientId,
    contactIds: [] as string[],
    opportunityId: undefined as string | undefined,
    activityIds: [] as string[],
    pricingRequestId: undefined as string | undefined,
    noteIds: [] as string[],
    documentId: undefined as string | undefined,
  };
  const createdContacts: Array<{ id: string; email?: string; fullName?: string }> = [];

  const failOnPermission = (status?: number, stepLabel?: string) => {
    if (status === 401) {
      removeAuthCookie();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Redirecting to login.");
    }
    if (status === 403) {
      throw new Error(`Insufficient role for step ${stepLabel ?? ""}`.trim());
    }
  };

  const resolveAssigneeId = async (roleHint?: string | null) => {
    if (!roleHint) return options.currentUserId;
    try {
      const response = await axios.get("/api/Users", {
        params: {
          role: roleHint,
          isActive: true,
          pageNumber: 1,
          pageSize: 20,
        },
      });
      const users = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : [];
      return users[0]?.id ?? options.currentUserId;
    } catch {
      return options.currentUserId;
    }
  };

  try {
    if (!created.clientId && plan.client) {
      try {
        const response = await axios.post("/api/Clients", plan.client);
        created.clientId = response.data?.id;
        if (!created.clientId) {
          const lookup = await axios.get("/api/Clients", {
            params: { searchTerm: plan.client.name, pageNumber: 1, pageSize: 20 },
          });
          const clients = Array.isArray(lookup.data)
            ? lookup.data
            : Array.isArray(lookup.data?.items)
            ? lookup.data.items
            : [];
          created.clientId =
            clients.find(
              (client: { name?: string; id?: string }) =>
                normalizeName(client.name) === normalizeName(plan.client?.name)
            )?.id ?? created.clientId;
        }
        steps.push({
          key: "client",
          label: "Create/Resolve Client",
          status: created.clientId ? "success" : "failed",
          message: created.clientId ? `Client ready (${created.clientId})` : "Could not resolve created client ID.",
        });
      } catch (error) {
        const status = getErrorStatus(error);
        failOnPermission(status, "Create/Resolve Client");
        steps.push({
          key: "client",
          label: "Create/Resolve Client",
          status: "failed",
          message: getErrorMessage(error, "Failed to create client."),
        });
        return {
          success: false,
          steps,
          warnings,
          created,
          links: [],
        };
      }
    } else {
      steps.push({
        key: "client",
        label: "Create/Resolve Client",
        status: created.clientId ? "success" : "skipped",
        message: created.clientId
          ? `Using existing client (${created.clientId})`
          : "No client data provided in plan.",
      });
    }

    if (!created.clientId) {
      return {
        success: false,
        steps,
        warnings: [...warnings, "Client ID is required before execution can continue."],
        created,
        links: [],
      };
    }

    if (plan.contacts.length > 0) {
      for (const contact of plan.contacts) {
        try {
          const response = await axios.post("/api/Contacts", {
            clientId: created.clientId,
            ...contact,
          });
          const createdContactId = response.data?.id;
          if (createdContactId) {
            created.contactIds.push(createdContactId);
            createdContacts.push({
              id: createdContactId,
              email: contact.email,
              fullName: `${contact.firstName} ${contact.lastName}`.trim(),
            });
            if (contact.isPrimaryContact) {
              await axios.put(`/api/Contacts/${createdContactId}/set-primary`);
            }
          }
        } catch (error) {
          const status = getErrorStatus(error);
          failOnPermission(status, "Create Contacts");
          warnings.push(
            `Contact ${contact.firstName} ${contact.lastName}: ${getErrorMessage(
              error,
              "Failed."
            )}`
          );
        }
      }
      steps.push({
        key: "contacts",
        label: "Create Contacts",
        status: created.contactIds.length > 0 ? "success" : "skipped",
        message:
          created.contactIds.length > 0
            ? `Created ${created.contactIds.length} contact(s).`
            : "No contacts created.",
      });
    } else {
      steps.push({
        key: "contacts",
        label: "Create Contacts",
        status: "skipped",
        message: "No contacts in plan.",
      });
    }

    if (plan.opportunity) {
      try {
        const matchedContactId = resolveContactIdByMatch(
          createdContacts,
          plan.opportunity.contactMatch
        );
        const response = await axios.post("/api/Opportunities", {
          ...plan.opportunity,
          clientId: created.clientId,
          contactId: matchedContactId ?? created.contactIds[0],
        });
        created.opportunityId = response.data?.id;
        steps.push({
          key: "opportunity",
          label: "Create Opportunity",
          status: created.opportunityId ? "success" : "failed",
          message: created.opportunityId
            ? `Opportunity created (${created.opportunityId})`
            : "Opportunity created but ID was not returned.",
        });
      } catch (error) {
        const status = getErrorStatus(error);
        failOnPermission(status, "Create Opportunity");
        steps.push({
          key: "opportunity",
          label: "Create Opportunity",
          status: "failed",
          message: getErrorMessage(error, "Failed to create opportunity."),
        });
      }
    } else {
      steps.push({
        key: "opportunity",
        label: "Create Opportunity",
        status: "skipped",
        message: "No opportunity in plan.",
      });
    }

    if (plan.activities.length > 0) {
      for (const activity of plan.activities) {
        try {
          const assignedToId = await resolveAssigneeId(activity.assignToRoleHint);
          const response = await axios.post("/api/Activities", {
            ...activity,
            priority: activity.priority ?? 2,
            assignedToId,
            relatedToType: created.opportunityId ? RelatedToType.Opportunity : RelatedToType.Client,
            relatedToId: created.opportunityId ?? created.clientId,
          });
          if (response.data?.id) created.activityIds.push(response.data.id);
        } catch (error) {
          const status = getErrorStatus(error);
          failOnPermission(status, "Create Activities");
          warnings.push(
            `Activity "${activity.subject}": ${getErrorMessage(error, "Failed.")}`
          );
        }
      }
      steps.push({
        key: "activities",
        label: "Create Activities",
        status: created.activityIds.length > 0 ? "success" : "skipped",
        message:
          created.activityIds.length > 0
            ? `Created ${created.activityIds.length} activity(s).`
            : "No activities created.",
      });
    } else {
      steps.push({
        key: "activities",
        label: "Create Activities",
        status: "skipped",
        message: "No activities in plan.",
      });
    }

    if (plan.pricingRequest) {
      if (!created.opportunityId) {
        warnings.push("Pricing request skipped because opportunity was not created.");
        steps.push({
          key: "pricing",
          label: "Create Pricing Request",
          status: "skipped",
          message: "Skipped: no opportunityId available.",
        });
      } else {
        try {
          const assignedToId = await resolveAssigneeId(
            plan.pricingRequest.assignToRoleHint
          );
          const response = await axios.post("/api/PricingRequests", {
            ...plan.pricingRequest,
            clientId: created.clientId,
            opportunityId: created.opportunityId,
            requestedById: options.currentUserId ?? assignedToId,
            assignedToId,
          });
          created.pricingRequestId = response.data?.id;
          steps.push({
            key: "pricing",
            label: "Create Pricing Request",
            status: created.pricingRequestId ? "success" : "failed",
            message: created.pricingRequestId
              ? `Pricing request created (${created.pricingRequestId})`
              : "Pricing request created but ID was not returned.",
          });
        } catch (error) {
          const status = getErrorStatus(error);
          failOnPermission(status, "Create Pricing Request");
          steps.push({
            key: "pricing",
            label: "Create Pricing Request",
            status: "failed",
            message: getErrorMessage(error, "Failed to create pricing request."),
          });
        }
      }
    } else {
      steps.push({
        key: "pricing",
        label: "Create Pricing Request",
        status: "skipped",
        message: "No pricing request in plan.",
      });
    }

    if (plan.notes.length > 0) {
      for (const note of plan.notes) {
        try {
          const relatedToOpportunity = note.relatedTo === "Opportunity" && !!created.opportunityId;
          const response = await axios.post("/api/Notes", {
            content: note.content,
            isPrivate: !!note.isPrivate,
            relatedToType: relatedToOpportunity ? RelatedToType.Opportunity : RelatedToType.Client,
            relatedToId: relatedToOpportunity
              ? created.opportunityId
              : created.clientId,
          });
          if (response.data?.id) {
            created.noteIds.push(response.data.id);
          }
        } catch (error) {
          const status = getErrorStatus(error);
          failOnPermission(status, "Create Notes");
          warnings.push(`Note creation failed: ${getErrorMessage(error, "Unknown error.")}`);
        }
      }
      steps.push({
        key: "notes",
        label: "Create Notes",
        status: created.noteIds.length > 0 ? "success" : "skipped",
        message:
          created.noteIds.length > 0
            ? `Created ${created.noteIds.length} note(s).`
            : "No notes created.",
      });
    } else {
      steps.push({
        key: "notes",
        label: "Create Notes",
        status: "skipped",
        message: "No notes in plan.",
      });
    }

    try {
      const file =
        options.originalFile ??
        (options.rawText
          ? new File([options.rawText], `ai-setup-${Date.now()}.txt`, {
              type: "text/plain",
            })
          : null);

      if (!file) {
        steps.push({
          key: "document",
          label: "Upload Original Document",
          status: "skipped",
          message: "No file or text available for document upload.",
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentCategory", "6");
        formData.append("relatedToType", String(RelatedToType.Client));
        formData.append("relatedToId", created.clientId);
        const response = await axios.post("/api/Documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        created.documentId = response.data?.id;
        steps.push({
          key: "document",
          label: "Upload Original Document",
          status: "success",
          message: "Source document uploaded.",
        });
      }
    } catch (error) {
      const status = getErrorStatus(error);
      failOnPermission(status, "Upload Original Document");
      steps.push({
        key: "document",
        label: "Upload Original Document",
        status: "failed",
        message: getErrorMessage(error, "Document upload failed."),
      });
    }

    const links = [
      created.clientId ? { label: "Client Workspace", href: `/clients/${created.clientId}/overview` } : null,
      created.opportunityId ? { label: "Opportunities", href: "/opportunities" } : null,
      created.pricingRequestId ? { label: "Pricing Requests", href: "/pricingrequests" } : null,
      { label: "Documents", href: "/documents" },
    ].filter((item): item is { label: string; href: string } => !!item);

    return {
      success: !steps.some((step) => step.status === "failed"),
      steps,
      warnings,
      created,
      links,
    };
  } catch (error) {
    const message = getErrorMessage(error, "Execution failed.");
    return {
      success: false,
      steps: [
        ...steps,
        {
          key: "fatal",
          label: "Execution",
          status: "failed",
          message,
        },
      ],
      warnings,
      created,
      links: [],
    };
  }
}
