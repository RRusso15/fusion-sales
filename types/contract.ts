import { ContractStatusValue } from "@/constants/enums";

export interface ContractDto {
  id: string;
  contractNumber?: string | null;
  clientId: string;
  clientName?: string | null;
  opportunityId?: string | null;
  opportunityTitle?: string | null;
  proposalId?: string | null;
  proposalNumber?: string | null;
  title?: string | null;
  contractValue: number;
  currency?: string | null;
  startDate: string;
  endDate: string;
  status: ContractStatusValue;
  statusName?: string | null;
  renewalNoticePeriod: number; // days
  autoRenew: boolean;
  terms?: string | null;
  ownerId: string;
  ownerName?: string | null;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
  renewalsCount?: number;
}
