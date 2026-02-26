"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  DashboardStateContext,
  DashboardActionContext,
} from "./context";
import { DashboardReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const DashboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    DashboardReducer,
    INITIAL_STATE
  );

  const axios = getAxiosInstance();

  const fetchOverview = async () => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Dashboard/overview"
      );

      dispatch(
        requestSuccess({
          overview: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchPipelineMetrics = async () => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Dashboard/pipeline-metrics"
      );

      dispatch(
        requestSuccess({
          pipelineMetrics: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchSalesPerformance = async (
    topCount: number = 5
  ) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Dashboard/sales-performance",
        {
          params: { topCount },
        }
      );

      dispatch(
        requestSuccess({
          salesPerformance: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchActivitiesSummary = async () => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Dashboard/activities-summary"
      );

      dispatch(
        requestSuccess({
          activitiesSummary: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchContractsExpiring = async (
    days: number = 30
  ) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Dashboard/contracts-expiring",
        {
          params: { days },
        }
      );

      dispatch(
        requestSuccess({
          contractsExpiring: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <DashboardStateContext.Provider value={state}>
      <DashboardActionContext.Provider
        value={{
          fetchOverview,
          fetchPipelineMetrics,
          fetchSalesPerformance,
          fetchActivitiesSummary,
          fetchContractsExpiring,
        }}
      >
        {children}
      </DashboardActionContext.Provider>
    </DashboardStateContext.Provider>
  );
};

export const useDashboardState = () => {
  const context = useContext(DashboardStateContext);
  if (!context) {
    throw new Error(
      "useDashboardState must be used within DashboardProvider"
    );
  }
  return context;
};

export const useDashboardActions = () => {
  const context = useContext(DashboardActionContext);
  if (!context) {
    throw new Error(
      "useDashboardActions must be used within DashboardProvider"
    );
  }
  return context;
};