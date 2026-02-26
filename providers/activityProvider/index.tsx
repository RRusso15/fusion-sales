"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  ActivityStateContext,
  ActivityActionContext,
  IActivity,
  IActivityActionContext,
} from "./context";
import { ActivityReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedActivity,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const ActivityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    ActivityReducer,
    INITIAL_STATE
  );

  const axios = getAxiosInstance();

  const fetchActivities: IActivityActionContext["fetchActivities"] = async (
    params
  ) => {
    dispatch(requestPending());
    try {
      const response = await axios.get("/api/Activities", {
        params,
      });
      const data = response.data;

      dispatch(
        requestSuccess({
          activities: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchActivityById = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/Activities/${id}`
      );
      dispatch(
        setSelectedActivity({
          selectedActivity: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchMyActivities: IActivityActionContext["fetchMyActivities"] =
    async (params) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Activities/my-activities",
        { params }
      );
      const data = response.data;

      dispatch(
        requestSuccess({
          activities: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchUpcomingActivities = async (
    daysAhead: number = 7
  ) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Activities/upcoming",
        {
          params: { daysAhead },
        }
      );

      dispatch(
        requestSuccess({
          activities: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchOverdueActivities = async () => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Activities/overdue"
      );

      dispatch(
        requestSuccess({
          activities: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createActivity = async (
    data: Partial<IActivity>
  ) => {
    dispatch(requestPending());
    try {
      await axios.post("/api/Activities", data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updateActivity = async (
    id: string,
    data: Partial<IActivity>
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Activities/${id}`, data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const completeActivity = async (
    id: string,
    outcome: string
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(
        `/api/Activities/${id}/complete`,
        { outcome }
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const cancelActivity = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Activities/${id}/cancel`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const deleteActivity = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.delete(`/api/Activities/${id}`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <ActivityStateContext.Provider value={state}>
      <ActivityActionContext.Provider
        value={{
          fetchActivities,
          fetchActivityById,
          fetchMyActivities,
          fetchUpcomingActivities,
          fetchOverdueActivities,
          createActivity,
          updateActivity,
          completeActivity,
          cancelActivity,
          deleteActivity,
        }}
      >
        {children}
      </ActivityActionContext.Provider>
    </ActivityStateContext.Provider>
  );
};

export const useActivityState = () => {
  const context = useContext(ActivityStateContext);
  if (!context) {
    throw new Error(
      "useActivityState must be used within ActivityProvider"
    );
  }
  return context;
};

export const useActivityActions = () => {
  const context = useContext(ActivityActionContext);
  if (!context) {
    throw new Error(
      "useActivityActions must be used within ActivityProvider"
    );
  }
  return context;
};
