import { createContext } from "react";

export interface IClient {
  id: string;
  name: string;
  industry?: string;
  clientType?: number;
  website?: string;
  billingAddress?: string;
  taxNumber?: string;
  companySize?: string;
  isActive?: boolean;
}

export interface IClientStats {
  opportunityCount: number;
  contractCount: number;
  totalContractValue: number;
}

export interface IClientStateContext {
  isPending: boolean;
  isError: boolean;
  clients: IClient[];
  selectedClient?: IClient;
  stats?: IClientStats;
  totalCount: number;
}

export interface IClientActionContext {
  fetchClients: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    industry?: string;
    clientType?: number;
    isActive?: boolean;
  }) => Promise<void>;

  fetchClientById: (id: string) => Promise<void>;
  fetchClientStats: (id: string) => Promise<void>;

  createClient: (data: Partial<IClient>) => Promise<void>;
  updateClient: (id: string, data: Partial<IClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IClientStateContext = {
  isPending: false,
  isError: false,
  clients: [],
  selectedClient: undefined,
  stats: undefined,
  totalCount: 0,
};

export const ClientStateContext =
  createContext<IClientStateContext>(INITIAL_STATE);

export const ClientActionContext =
  createContext<IClientActionContext>(undefined as any);