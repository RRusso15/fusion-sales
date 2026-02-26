import { createContext } from "react";
import { ContractStatusValue } from "@/constants/enums";

export interface IContractRenewal {
  id?: string;
  proposedStartDate: string;
  proposedEndDate: string;
  proposedValue: number;
  notes?: string;
}

export interface IContract {
  id: string;
  clientId: string;
  opportunityId?: string;
  proposalId?: string;
  title: string;
  contractValue: number;
  currency: string;
  startDate: string;
  endDate: string;
  ownerId?: string;
  renewalNoticePeriod?: number;
  autoRenew?: boolean;
  terms?: string;
  status?: ContractStatusValue;

  // Computed fields from backend
  isExpiringSoon?: boolean;
  daysUntilExpiry?: number;
}

export interface IContractStateContext {
  isPending: boolean;
  isError: boolean;
  contracts: IContract[];
  selectedContract?: IContract;
  totalCount: number;
}

export interface IContractActionContext {
  fetchContracts: (params?: {
    clientId?: string;
    status?: ContractStatusValue;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchContractById: (id: string) => Promise<void>;
  fetchExpiringContracts: (daysUntilExpiry?: number) => Promise<void>;
  fetchContractsByClient: (clientId: string) => Promise<void>;

  createContract: (data: Partial<IContract>) => Promise<void>;
  updateContract: (id: string, data: Partial<IContract>) => Promise<void>;

  activateContract: (id: string) => Promise<void>;
  cancelContract: (id: string) => Promise<void>;

  deleteContract: (id: string) => Promise<void>;

  createRenewal: (
    contractId: string,
    data: Partial<IContractRenewal>
  ) => Promise<void>;

  completeRenewal: (renewalId: string) => Promise<void>;
}

export const INITIAL_STATE: IContractStateContext = {
  isPending: false,
  isError: false,
  contracts: [],
  selectedContract: undefined,
  totalCount: 0,
};

export const ContractStateContext =
  createContext<IContractStateContext>(INITIAL_STATE);

const defaultActionContext: IContractActionContext = {
  fetchContracts: async () => {
    throw new Error("ContractProvider not mounted");
  },
  fetchContractById: async () => {
    throw new Error("ContractProvider not mounted");
  },
  fetchExpiringContracts: async () => {
    throw new Error("ContractProvider not mounted");
  },
  fetchContractsByClient: async () => {
    throw new Error("ContractProvider not mounted");
  },
  createContract: async () => {
    throw new Error("ContractProvider not mounted");
  },
  updateContract: async () => {
    throw new Error("ContractProvider not mounted");
  },
  activateContract: async () => {
    throw new Error("ContractProvider not mounted");
  },
  cancelContract: async () => {
    throw new Error("ContractProvider not mounted");
  },
  deleteContract: async () => {
    throw new Error("ContractProvider not mounted");
  },
  createRenewal: async () => {
    throw new Error("ContractProvider not mounted");
  },
  completeRenewal: async () => {
    throw new Error("ContractProvider not mounted");
  },
};

export const ContractActionContext =
  createContext<IContractActionContext>(defaultActionContext);
