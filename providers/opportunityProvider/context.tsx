import { createContext } from "react";

export interface IOpportunity {
  id: string;
  title: string;
  clientId: string;
  contactId?: string;
  estimatedValue?: number;
  currency?: string;
  stage?: number;
  source?: number;
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
    stage?: number;
    ownerId?: string;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchMyOpportunities: (params?: {
    stage?: number;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchPipeline: (ownerId?: string) => Promise<void>;

  fetchOpportunityById: (id: string) => Promise<void>;
  fetchStageHistory: (id: string) => Promise<void>;

  createOpportunity: (data: Partial<IOpportunity>) => Promise<void>;
  updateOpportunity: (id: string, data: Partial<IOpportunity>) => Promise<void>;

  moveStage: (id: string, stage: number, reason?: string) => Promise<void>;
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

export const OpportunityActionContext =
  createContext<IOpportunityActionContext>(undefined as any);