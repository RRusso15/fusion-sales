import { createContext } from "react";
import { PricingRequestStatusValue, PriorityValue } from "@/constants/enums";

export interface IPricingRequest {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  opportunityId?: string;
  requestedById: string;
  assignedToId?: string;
  priority?: PriorityValue;
  status?: PricingRequestStatusValue;
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
    clientId?: string;
    status?: PricingRequestStatusValue;
    priority?: PriorityValue;
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

const defaultActionContext: IPricingActionContext = {
  fetchPricingRequests: async () => {
    throw new Error("PricingProvider not mounted");
  },
  fetchPricingRequestById: async () => {
    throw new Error("PricingProvider not mounted");
  },
  fetchPendingRequests: async () => {
    throw new Error("PricingProvider not mounted");
  },
  fetchMyRequests: async () => {
    throw new Error("PricingProvider not mounted");
  },
  createPricingRequest: async () => {
    throw new Error("PricingProvider not mounted");
  },
  updatePricingRequest: async () => {
    throw new Error("PricingProvider not mounted");
  },
  assignPricingRequest: async () => {
    throw new Error("PricingProvider not mounted");
  },
  completePricingRequest: async () => {
    throw new Error("PricingProvider not mounted");
  },
};

export const PricingActionContext =
  createContext<IPricingActionContext>(defaultActionContext);
