import {
  OpportunitySourceValue,
  OpportunityStageValue,
} from "@/constants/enums";

export interface OpportunityDto {
  id: string;
  title?: string | null;
  clientId: string;
  clientName?: string | null;
  contactId?: string | null;
  contactName?: string | null;
  ownerId: string;                // assigned user
  ownerName?: string | null;
  estimatedValue: number;
  currency?: string | null;
  probability: number;            // int
  stage: OpportunityStageValue;
  stageName?: string | null;
  source?: OpportunitySourceValue;
  expectedCloseDate?: string | null; // date-time
  actualCloseDate?: string | null;
  description?: string | null;
  lossReason?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}
