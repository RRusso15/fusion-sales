import { createContext } from "react";
import { ProposalStatusValue } from "@/constants/enums";

export interface IProposalLineItem {
  id?: string;
  productServiceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  total?: number;
}

export interface IProposal {
  id: string;
  opportunityId: string;
  clientId: string;
  title: string;
  description?: string;
  currency: string;
  validUntil?: string;
  status?: ProposalStatusValue;
  subtotal?: number;
  taxTotal?: number;
  grandTotal?: number;
  lineItems?: IProposalLineItem[];
}

export interface IProposalStateContext {
  isPending: boolean;
  isError: boolean;
  proposals: IProposal[];
  selectedProposal?: IProposal;
  totalCount: number;
}

export interface IProposalActionContext {
  fetchProposals: (params?: {
    clientId?: string;
    opportunityId?: string;
    status?: ProposalStatusValue;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchProposalById: (id: string) => Promise<void>;

  createProposal: (data: Partial<IProposal>) => Promise<void>;
  updateProposal: (id: string, data: Partial<IProposal>) => Promise<void>;

  addLineItem: (
    proposalId: string,
    data: Partial<IProposalLineItem>
  ) => Promise<void>;

  updateLineItem: (
    proposalId: string,
    lineItemId: string,
    data: Partial<IProposalLineItem>
  ) => Promise<void>;

  deleteLineItem: (
    proposalId: string,
    lineItemId: string
  ) => Promise<void>;

  submitProposal: (id: string) => Promise<void>;
  approveProposal: (id: string) => Promise<void>;
  rejectProposal: (id: string, reason: string) => Promise<void>;

  deleteProposal: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IProposalStateContext = {
  isPending: false,
  isError: false,
  proposals: [],
  selectedProposal: undefined,
  totalCount: 0,
};

export const ProposalStateContext =
  createContext<IProposalStateContext>(INITIAL_STATE);

const defaultActionContext: IProposalActionContext = {
  fetchProposals: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  fetchProposalById: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  createProposal: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  updateProposal: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  addLineItem: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  updateLineItem: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  deleteLineItem: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  submitProposal: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  approveProposal: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  rejectProposal: async () => {
    throw new Error("ProposalProvider not mounted");
  },
  deleteProposal: async () => {
    throw new Error("ProposalProvider not mounted");
  },
};

export const ProposalActionContext =
  createContext<IProposalActionContext>(defaultActionContext);
