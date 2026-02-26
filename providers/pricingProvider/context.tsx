import { createContext } from "react";

export interface IPricingRequest {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  opportunityId?: string;
  requestedById: string;
  assignedToId?: string;
  priority?: number;
  status?: number;
  requiredByDate?: string;
  createdAt?: string;
}

export interface IPricingStateContext {
  isPending: boolean;
  isError: boolean;
  pricingRequests: IPricingRequest[];
  selectedPricingRequest?: IPricingRequest;
  totalCount: number;
}

export interface IPricingActionContext {
  fetchPricingRequests: (params?: {
    status?: number;
    priority?: number;
    assignedToId?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchPricingRequestById: (id: string) => Promise<void>;

  fetchPendingRequests: () => Promise<void>;
  fetchMyRequests: () => Promise<void>;

  createPricingRequest: (
    data: Partial<IPricingRequest>
  ) => Promise<void>;

  updatePricingRequest: (
    id: string,
    data: Partial<IPricingRequest>
  ) => Promise<void>;

  assignPricingRequest: (
    id: string,
    userId: string
  ) => Promise<void>;

  completePricingRequest: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IPricingStateContext = {
  isPending: false,
  isError: false,
  pricingRequests: [],
  selectedPricingRequest: undefined,
  totalCount: 0,
};

export const PricingStateContext =
  createContext<IPricingStateContext>(INITIAL_STATE);

export const PricingActionContext =
  createContext<IPricingActionContext>(undefined as any);