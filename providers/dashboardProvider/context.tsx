import { createContext } from "react";

/* ---------- Overview Types ---------- */

export interface IDashboardOverview {
  opportunities: {
    totalCount: number;
    wonCount: number;
    winRate: number;
    pipelineValue: number;
  };
  pipeline: {
    stages: any[];
    weightedPipelineValue: number;
  };
  activities: {
    upcomingCount: number;
    overdueCount: number;
    completedTodayCount: number;
  };
  contracts: {
    totalActiveCount: number;
    expiringThisMonthCount: number;
    totalContractValue: number;
  };
  revenue: {
    thisMonth: number;
    thisQuarter: number;
    thisYear: number;
    monthlyTrend: any[];
  };
}

/* ---------- Additional Dashboard Data ---------- */

export interface IPipelineMetrics {
  stages: any[];
}

export interface ISalesPerformance {
  userId: string;
  userName: string;
  totalRevenue: number;
  dealsWon: number;
}

export interface IActivitiesSummary {
  groupedByType: any[];
  groupedByStatus: any[];
}

export interface IContractsExpiring {
  id: string;
  title: string;
  endDate: string;
  daysUntilExpiry: number;
}

/* ---------- State ---------- */

export interface IDashboardStateContext {
  isPending: boolean;
  isError: boolean;

  overview?: IDashboardOverview;
  pipelineMetrics?: IPipelineMetrics;
  salesPerformance?: ISalesPerformance[];
  activitiesSummary?: IActivitiesSummary;
  contractsExpiring?: IContractsExpiring[];
}

export interface IDashboardActionContext {
  fetchOverview: () => Promise<void>;
  fetchPipelineMetrics: () => Promise<void>;
  fetchSalesPerformance: (topCount?: number) => Promise<void>;
  fetchActivitiesSummary: () => Promise<void>;
  fetchContractsExpiring: (days?: number) => Promise<void>;
}

export const INITIAL_STATE: IDashboardStateContext = {
  isPending: false,
  isError: false,
};

export const DashboardStateContext =
  createContext<IDashboardStateContext>(INITIAL_STATE);

export const DashboardActionContext =
  createContext<IDashboardActionContext>(undefined as any);