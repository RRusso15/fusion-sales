import type { DocumentCategoryValue, RelatedToTypeValue } from "@/constants/enums";

export interface DocumentRow {
  id: string;
  name?: string;
  fileName?: string;
  documentCategory?: number;
  category?: number;
  relatedToType?: number;
  relatedToId?: string;
  createdAt?: string;
}

export interface UploadDocumentForm {
  documentCategory?: DocumentCategoryValue;
  relatedToType?: RelatedToTypeValue;
  relatedToId?: string;
  description?: string;
}

export interface AIExtractedLeadFields {
  clientName?: string | null;
  industry?: string | null;
  website?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPosition?: string | null;
  opportunityTitle?: string | null;
  estimatedValue?: number | null;
  source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "RFP" | null;
}

export interface DocumentRecommendation {
  documentType?: "lead" | "contract" | "invoice" | "proposal" | "report" | "other";
  recommendedAction?: "create_lead_opportunity" | "none";
  confidence?: number;
  reasoning?: string;
  extracted?: AIExtractedLeadFields;
}

export interface LeadExecutionForm {
  clientName: string;
  industry?: string;
  website?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPosition?: string;
  opportunityTitle?: string;
  estimatedValue?: number;
  source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "RFP";
}

export interface RelatedClientOption {
  id: string;
  name?: string | null;
}

export interface DocumentsModuleProps {
  clientId?: string;
}

