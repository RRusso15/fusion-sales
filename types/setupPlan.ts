export type ClientTypeValue = 1 | 2 | 3;
export type OpportunityStageValue = 1 | 2 | 3 | 4 | 5 | 6;
export type OpportunitySourceValue = 1 | 2 | 3 | 4 | 5;
export type ActivityTypeValue = 1 | 2 | 3 | 4 | 5 | 6;
export type PriorityValue = 1 | 2 | 3 | 4;

export type AssignToRoleHint =
  | "Admin"
  | "SalesManager"
  | "BusinessDevelopmentManager"
  | "SalesRep"
  | null;

export interface SetupPlanClient {
  name: string;
  industry?: string;
  clientType?: ClientTypeValue;
  website?: string;
  billingAddress?: string;
  taxNumber?: string;
  companySize?: string;
}

export interface SetupPlanContact {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  isPrimaryContact?: boolean;
}

export interface SetupPlanOpportunity {
  title: string;
  clientId?: string;
  contactMatch?: {
    email?: string;
    fullName?: string;
  };
  estimatedValue?: number;
  currency?: string;
  stage?: OpportunityStageValue;
  source?: OpportunitySourceValue;
  probability?: number;
  expectedCloseDate?: string;
  description?: string;
}

export interface SetupPlanActivity {
  type: ActivityTypeValue;
  subject: string;
  description?: string;
  priority?: PriorityValue;
  dueDate?: string;
  duration?: number;
  location?: string;
  assignToRoleHint?: AssignToRoleHint;
}

export interface SetupPlanPricingRequest {
  title: string;
  description?: string;
  priority?: PriorityValue;
  requiredByDate?: string;
  assignToRoleHint?: "SalesManager" | "BusinessDevelopmentManager" | null;
}

export interface SetupPlanNote {
  content: string;
  isPrivate?: boolean;
  relatedTo: "Client" | "Opportunity";
}

export interface SetupPlan {
  client: SetupPlanClient | null;
  contacts: SetupPlanContact[];
  opportunity: SetupPlanOpportunity | null;
  activities: SetupPlanActivity[];
  pricingRequest: SetupPlanPricingRequest | null;
  notes: SetupPlanNote[];
}
