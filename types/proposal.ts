export type ProposalStatus = 1 | 2 | 3 | 4; // Draft, Submitted, Rejected, Approved

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
  status?: ProposalStatus;
  lineItems?: ProposalLineItemDto[];
  createdAt?: string;
  updatedAt?: string;
}