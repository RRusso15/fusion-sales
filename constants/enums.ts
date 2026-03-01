export const ClientType = {
  Government: 1,
  Private: 2,
  Partner: 3,
} as const;

export type ClientTypeValue = (typeof ClientType)[keyof typeof ClientType];

export const OpportunityStage = {
  Lead: 1,
  Qualified: 2,
  Proposal: 3,
  Negotiation: 4,
  ClosedWon: 5,
  ClosedLost: 6,
} as const;

export type OpportunityStageValue =
  (typeof OpportunityStage)[keyof typeof OpportunityStage];

export const OpportunitySource = {
  Inbound: 1,
  Outbound: 2,
  Referral: 3,
  Partner: 4,
  Rfp: 5,
} as const;

export type OpportunitySourceValue =
  (typeof OpportunitySource)[keyof typeof OpportunitySource];

export const ProposalStatus = {
  Draft: 1,
  Submitted: 2,
  Rejected: 3,
  Approved: 4,
} as const;

export type ProposalStatusValue =
  (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const PricingRequestStatus = {
  Pending: 1,
  InProgress: 2,
  Completed: 3,
} as const;

export type PricingRequestStatusValue =
  (typeof PricingRequestStatus)[keyof typeof PricingRequestStatus];

export const ContractStatus = {
  Draft: 1,
  Active: 2,
  Expired: 3,
  Renewed: 4,
  Cancelled: 5,
} as const;

export type ContractStatusValue =
  (typeof ContractStatus)[keyof typeof ContractStatus];

export const ActivityType = {
  Meeting: 1,
  Call: 2,
  Email: 3,
  Task: 4,
  Presentation: 5,
  Other: 6,
} as const;

export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType];

export const ActivityStatus = {
  Scheduled: 1,
  Completed: 2,
  Cancelled: 3,
} as const;

export type ActivityStatusValue =
  (typeof ActivityStatus)[keyof typeof ActivityStatus];

export const Priority = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
} as const;

export type PriorityValue = (typeof Priority)[keyof typeof Priority];

export const DocumentCategory = {
  Contract: 1,
  Proposal: 2,
  Presentation: 3,
  Quote: 4,
  Report: 5,
  Other: 6,
} as const;

export type DocumentCategoryValue =
  (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const RelatedToType = {
  Client: 1,
  Opportunity: 2,
  Proposal: 3,
  Contract: 4,
  Activity: 5,
} as const;

export type RelatedToTypeValue =
  (typeof RelatedToType)[keyof typeof RelatedToType];

type EnumValue = number | string;
type EnumMap = Record<string, EnumValue>;

const createReverseLookup = <T extends EnumMap>(map: T) =>
  Object.fromEntries(
    Object.entries(map).map(([label, value]) => [value, label as keyof T])
  ) as Record<T[keyof T], keyof T>;

export const ClientTypeLabels: Record<ClientTypeValue, string> = {
  [ClientType.Government]: "Government",
  [ClientType.Private]: "Private",
  [ClientType.Partner]: "Partner",
};

export const OpportunityStageLabels: Record<OpportunityStageValue, string> = {
  [OpportunityStage.Lead]: "Lead",
  [OpportunityStage.Qualified]: "Qualified",
  [OpportunityStage.Proposal]: "Proposal",
  [OpportunityStage.Negotiation]: "Negotiation",
  [OpportunityStage.ClosedWon]: "Closed Won",
  [OpportunityStage.ClosedLost]: "Closed Lost",
};

export const OpportunitySourceLabels: Record<OpportunitySourceValue, string> = {
  [OpportunitySource.Inbound]: "Inbound",
  [OpportunitySource.Outbound]: "Outbound",
  [OpportunitySource.Referral]: "Referral",
  [OpportunitySource.Partner]: "Partner",
  [OpportunitySource.Rfp]: "RFP",
};

export const ProposalStatusLabels: Record<ProposalStatusValue, string> = {
  [ProposalStatus.Draft]: "Draft",
  [ProposalStatus.Submitted]: "Submitted",
  [ProposalStatus.Rejected]: "Rejected",
  [ProposalStatus.Approved]: "Approved",
};

export const PricingRequestStatusLabels: Record<PricingRequestStatusValue, string> = {
  [PricingRequestStatus.Pending]: "Pending",
  [PricingRequestStatus.InProgress]: "In Progress",
  [PricingRequestStatus.Completed]: "Completed",
};

export const ContractStatusLabels: Record<ContractStatusValue, string> = {
  [ContractStatus.Draft]: "Draft",
  [ContractStatus.Active]: "Active",
  [ContractStatus.Expired]: "Expired",
  [ContractStatus.Renewed]: "Renewed",
  [ContractStatus.Cancelled]: "Cancelled",
};

export const ActivityTypeLabels: Record<ActivityTypeValue, string> = {
  [ActivityType.Meeting]: "Meeting",
  [ActivityType.Call]: "Call",
  [ActivityType.Email]: "Email",
  [ActivityType.Task]: "Task",
  [ActivityType.Presentation]: "Presentation",
  [ActivityType.Other]: "Other",
};

export const ActivityStatusLabels: Record<ActivityStatusValue, string> = {
  [ActivityStatus.Scheduled]: "Scheduled",
  [ActivityStatus.Completed]: "Completed",
  [ActivityStatus.Cancelled]: "Cancelled",
};

export const PriorityLabels: Record<PriorityValue, string> = {
  [Priority.Low]: "Low",
  [Priority.Medium]: "Medium",
  [Priority.High]: "High",
  [Priority.Urgent]: "Urgent",
};

export const DocumentCategoryLabels: Record<DocumentCategoryValue, string> = {
  [DocumentCategory.Contract]: "Contract",
  [DocumentCategory.Proposal]: "Proposal",
  [DocumentCategory.Presentation]: "Presentation",
  [DocumentCategory.Quote]: "Quote",
  [DocumentCategory.Report]: "Report",
  [DocumentCategory.Other]: "Other",
};

export const RelatedToTypeLabels: Record<RelatedToTypeValue, string> = {
  [RelatedToType.Client]: "Client",
  [RelatedToType.Opportunity]: "Opportunity",
  [RelatedToType.Proposal]: "Proposal",
  [RelatedToType.Contract]: "Contract",
  [RelatedToType.Activity]: "Activity",
};

export const ClientTypeByValue = createReverseLookup(ClientType);
export const OpportunityStageByValue = createReverseLookup(OpportunityStage);
export const OpportunitySourceByValue = createReverseLookup(OpportunitySource);
export const ProposalStatusByValue = createReverseLookup(ProposalStatus);
export const PricingRequestStatusByValue =
  createReverseLookup(PricingRequestStatus);
export const ContractStatusByValue = createReverseLookup(ContractStatus);
export const ActivityTypeByValue = createReverseLookup(ActivityType);
export const ActivityStatusByValue = createReverseLookup(ActivityStatus);
export const PriorityByValue = createReverseLookup(Priority);
export const DocumentCategoryByValue = createReverseLookup(DocumentCategory);
export const RelatedToTypeByValue = createReverseLookup(RelatedToType);
