import { createContext } from "react";

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
  status?: number;

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
    status?: number;
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

export const ContractActionContext =
  createContext<IContractActionContext>(undefined as any);