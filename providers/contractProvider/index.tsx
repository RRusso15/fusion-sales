"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  ContractStateContext,
  ContractActionContext,
  IContract,
  IContractRenewal,
} from "./context";
import { ContractReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedContract,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const ContractProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    ContractReducer,
    INITIAL_STATE
  );

  const axios = getAxiosInstance();

  const fetchContracts = async (params?: any) => {
    dispatch(requestPending());
    try {
      const response = await axios.get("/api/Contracts", {
        params,
      });
      const data = response.data;

      dispatch(
        requestSuccess({
          contracts: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchContractById = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/Contracts/${id}`
      );
      dispatch(
        setSelectedContract({
          selectedContract: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchExpiringContracts = async (
    daysUntilExpiry: number = 90
  ) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        "/api/Contracts/expiring",
        {
          params: { daysUntilExpiry },
        }
      );

      dispatch(
        requestSuccess({
          contracts: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchContractsByClient = async (clientId: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/Contracts/client/${clientId}`
      );
      dispatch(
        requestSuccess({
          contracts: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createContract = async (
    data: Partial<IContract>
  ) => {
    dispatch(requestPending());
    try {
      await axios.post("/api/Contracts", data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updateContract = async (
    id: string,
    data: Partial<IContract>
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Contracts/${id}`, data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const activateContract = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.put(
        `/api/Contracts/${id}/activate`
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const cancelContract = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Contracts/${id}/cancel`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const deleteContract = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.delete(`/api/Contracts/${id}`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createRenewal = async (
    contractId: string,
    data: Partial<IContractRenewal>
  ) => {
    dispatch(requestPending());
    try {
      await axios.post(
        `/api/Contracts/${contractId}/renewals`,
        data
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const completeRenewal = async (
    renewalId: string
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(
        `/api/Contracts/renewals/${renewalId}/complete`
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <ContractStateContext.Provider value={state}>
      <ContractActionContext.Provider
        value={{
          fetchContracts,
          fetchContractById,
          fetchExpiringContracts,
          fetchContractsByClient,
          createContract,
          updateContract,
          activateContract,
          cancelContract,
          deleteContract,
          createRenewal,
          completeRenewal,
        }}
      >
        {children}
      </ContractActionContext.Provider>
    </ContractStateContext.Provider>
  );
};

export const useContractState = () => {
  const context = useContext(ContractStateContext);
  if (!context) {
    throw new Error(
      "useContractState must be used within ContractProvider"
    );
  }
  return context;
};

export const useContractActions = () => {
  const context = useContext(ContractActionContext);
  if (!context) {
    throw new Error(
      "useContractActions must be used within ContractProvider"
    );
  }
  return context;
};