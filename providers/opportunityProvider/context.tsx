import { createContext } from "react";
import {
  OpportunitySourceValue,
  OpportunityStageValue,
} from "@/constants/enums";

export interface IOpportunity {
  id: string;
  title: string;
  clientId: string;
  contactId?: string;
  estimatedValue?: number;
  currency?: string;
  stage?: OpportunityStageValue;
  source?: OpportunitySourceValue;
  probability?: number;
  expectedCloseDate?: string;
  description?: string;
  ownerId?: string;
}

export interface IStageHistory {
  id: string;
  opportunityId: string;
  previousStage: number;
  newStage: number;
  reason?: string;
  changedAt: string;
  changedBy?: string;
}

export interface IPipelineStage {
  stage: number;
  opportunityCount: number;
  totalValue: number;
  weightedValue: number;
  conversionRate?: number;
}

export interface IPipelineView {
  stages: IPipelineStage[];
  totalPipelineValue: number;
  weightedPipelineValue: number;
}

export interface IOpportunityStateContext {
  isPending: boolean;
  isError: boolean;
  opportunities: IOpportunity[];
  selectedOpportunity?: IOpportunity;
  stageHistory: IStageHistory[];
  pipeline?: IPipelineView;
  totalCount: number;
}

export interface IOpportunityActionContext {
  fetchOpportunities: (params?: {
    clientId?: string;
    stage?: OpportunityStageValue;
    ownerId?: string;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchMyOpportunities: (params?: {
    clientId?: string;
    stage?: OpportunityStageValue;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchPipeline: (ownerId?: string) => Promise<void>;

  fetchOpportunityById: (id: string) => Promise<void>;
  fetchStageHistory: (id: string) => Promise<void>;

  createOpportunity: (data: Partial<IOpportunity>) => Promise<void>;
  updateOpportunity: (id: string, data: Partial<IOpportunity>) => Promise<void>;

  moveStage: (
    id: string,
    stage: OpportunityStageValue,
    reason?: string
  ) => Promise<void>;
  advanceStage: (id: string, reason?: string) => Promise<void>;
  assignOpportunity: (id: string, userId: string) => Promise<void>;

  deleteOpportunity: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IOpportunityStateContext = {
  isPending: false,
  isError: false,
  opportunities: [],
  selectedOpportunity: undefined,
  stageHistory: [],
  pipeline: undefined,
  totalCount: 0,
};

export const OpportunityStateContext =
  createContext<IOpportunityStateContext>(INITIAL_STATE);

const defaultActionContext: IOpportunityActionContext = {
  fetchOpportunities: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  fetchMyOpportunities: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  fetchPipeline: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  fetchOpportunityById: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  fetchStageHistory: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  createOpportunity: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  updateOpportunity: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  moveStage: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  advanceStage: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  assignOpportunity: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
  deleteOpportunity: async () => {
    throw new Error("OpportunityProvider not mounted");
  },
};

export const OpportunityActionContext =
  createContext<IOpportunityActionContext>(defaultActionContext);
