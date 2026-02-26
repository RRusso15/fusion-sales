"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  PricingStateContext,
  PricingActionContext,
  IPricingRequest,
} from "./context";
import { PricingReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedPricingRequest,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const PricingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    PricingReducer,
    INITIAL_STATE
  );

  const axios = getAxiosInstance();

  const fetchPricingRequests = async (params?: any) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/PricingRequests",
        { params }
      );

      const data = response.data;

      dispatch(
        requestSuccess({
          pricingRequests: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchPricingRequestById = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/PricingRequests/${id}`
      );

      dispatch(
        setSelectedPricingRequest({
          selectedPricingRequest: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchPendingRequests = async () => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/PricingRequests/pending"
      );

      dispatch(
        requestSuccess({
          pricingRequests: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchMyRequests = async () => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/PricingRequests/my-requests"
      );

      dispatch(
        requestSuccess({
          pricingRequests: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createPricingRequest = async (
    data: Partial<IPricingRequest>
  ) => {
    dispatch(requestPending());
    try {
      await axios.post(
        "/api/PricingRequests",
        data
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updatePricingRequest = async (
    id: string,
    data: Partial<IPricingRequest>
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(
        `/api/PricingRequests/${id}`,
        data
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const assignPricingRequest = async (
    id: string,
    userId: string
  ) => {
    dispatch(requestPending());
    try {
      await axios.post(
        `/api/PricingRequests/${id}/assign`,
        { userId }
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const completePricingRequest = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.put(
        `/api/PricingRequests/${id}/complete`
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <PricingStateContext.Provider value={state}>
      <PricingActionContext.Provider
        value={{
          fetchPricingRequests,
          fetchPricingRequestById,
          fetchPendingRequests,
          fetchMyRequests,
          createPricingRequest,
          updatePricingRequest,
          assignPricingRequest,
          completePricingRequest,
        }}
      >
        {children}
      </PricingActionContext.Provider>
    </PricingStateContext.Provider>
  );
};

export const usePricingState = () => {
  const context = useContext(PricingStateContext);
  if (!context) {
    throw new Error(
      "usePricingState must be used within PricingProvider"
    );
  }
  return context;
};

export const usePricingActions = () => {
  const context = useContext(PricingActionContext);
  if (!context) {
    throw new Error(
      "usePricingActions must be used within PricingProvider"
    );
  }
  return context;
};