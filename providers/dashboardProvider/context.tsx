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
    stages: unknown[];
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
    monthlyTrend: unknown[];
  };
}

/* ---------- Additional Dashboard Data ---------- */

export interface IPipelineMetrics {
  stages: unknown[];
}

export interface ISalesPerformance {
  userId: string;
  userName: string;
  totalRevenue: number;
  dealsWon: number;
}

export interface IActivitiesSummary {
  groupedByType: unknown[];
  groupedByStatus: unknown[];
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

const defaultActionContext: IDashboardActionContext = {
  fetchOverview: async () => {
    throw new Error("DashboardProvider not mounted");
  },
  fetchPipelineMetrics: async () => {
    throw new Error("DashboardProvider not mounted");
  },
  fetchSalesPerformance: async () => {
    throw new Error("DashboardProvider not mounted");
  },
  fetchActivitiesSummary: async () => {
    throw new Error("DashboardProvider not mounted");
  },
  fetchContractsExpiring: async () => {
    throw new Error("DashboardProvider not mounted");
  },
};

export const DashboardActionContext =
  createContext<IDashboardActionContext>(defaultActionContext);
