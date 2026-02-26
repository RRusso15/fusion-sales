import { ProposalStatusValue } from "@/constants/enums";

export interface ProposalLineItemDto {
  id: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  total?: number;
}

export interface ProposalDto {
  id: string;
  opportunityId: string;
  title?: string | null;
  currency?: string | null;
  validUntil?: string | null; // date
  totalAmount?: number;
  status?: ProposalStatusValue;
  lineItems?: ProposalLineItemDto[];
  createdAt?: string;
  updatedAt?: string;
}
