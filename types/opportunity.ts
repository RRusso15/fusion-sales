// API uses numeric enums for stages and sources. Keep numeric types to match API.
export type OpportunityStage = 1 | 2 | 3 | 4 | 5 | 6; // see swagger (1..6)
export type OpportunitySource = 1 | 2 | 3 | 4 | 5;

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
  stage: OpportunityStage;
  stageName?: string | null;
  source?: OpportunitySource;
  expectedCloseDate?: string | null; // date-time
  actualCloseDate?: string | null;
  description?: string | null;
  lossReason?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}