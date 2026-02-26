"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  OpportunityStateContext,
  OpportunityActionContext,
  IOpportunity,
} from "./context";
import { OpportunityReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedOpportunity,
  setStageHistory,
  setPipeline,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const OpportunityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    OpportunityReducer,
    INITIAL_STATE
  );
  const axios = getAxiosInstance();

  const fetchOpportunities = async (params?: any) => {
    dispatch(requestPending());
    try {
      const response = await axios.get("/api/Opportunities", {
        params,
      });
      const data = response.data;
      dispatch(
        requestSuccess({
          opportunities: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchMyOpportunities = async (params?: any) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Opportunities/my-opportunities",
        { params }
      );
      dispatch(
        requestSuccess({
          opportunities: response.data.items ?? response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchPipeline = async (ownerId?: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Opportunities/pipeline",
        { params: { ownerId } }
      );
      dispatch(
        setPipeline({
          pipeline: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchOpportunityById = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/Opportunities/${id}`
      );
      dispatch(
        setSelectedOpportunity({
          selectedOpportunity: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchStageHistory = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/Opportunities/${id}/stage-history`
      );
      dispatch(
        setStageHistory({
          stageHistory: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createOpportunity = async (
    data: Partial<IOpportunity>
  ) => {
    dispatch(requestPending());
    try {
      await axios.post("/api/Opportunities", data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updateOpportunity = async (
    id: string,
    data: Partial<IOpportunity>
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Opportunities/${id}`, data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const moveStage = async (
    id: string,
    stage: number,
    reason?: string
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Opportunities/${id}/stage`, {
        stage,
        reason,
      });
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const assignOpportunity = async (
    id: string,
    userId: string
  ) => {
    dispatch(requestPending());
    try {
      await axios.post(
        `/api/Opportunities/${id}/assign`,
        { userId }
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const deleteOpportunity = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.delete(`/api/Opportunities/${id}`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <OpportunityStateContext.Provider value={state}>
      <OpportunityActionContext.Provider
        value={{
          fetchOpportunities,
          fetchMyOpportunities,
          fetchPipeline,
          fetchOpportunityById,
          fetchStageHistory,
          createOpportunity,
          updateOpportunity,
          moveStage,
          assignOpportunity,
          deleteOpportunity,
        }}
      >
        {children}
      </OpportunityActionContext.Provider>
    </OpportunityStateContext.Provider>
  );
};

export const useOpportunityState = () => {
  const context = useContext(OpportunityStateContext);
  if (!context) {
    throw new Error(
      "useOpportunityState must be used within OpportunityProvider"
    );
  }
  return context;
};

export const useOpportunityActions = () => {
  const context = useContext(OpportunityActionContext);
  if (!context) {
    throw new Error(
      "useOpportunityActions must be used within OpportunityProvider"
    );
  }
  return context;
};