"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  ClientStateContext,
  ClientActionContext,
  IClient,
  IClientActionContext,
} from "./context";
import { ClientReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedClient,
  setStats,
} from "./actions";

import { getAxiosInstance } from "@/utils/axiosInstance";

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(ClientReducer, INITIAL_STATE);
  const axios = getAxiosInstance();

  const fetchClients: IClientActionContext["fetchClients"] = async (params) => {
    dispatch(requestPending());

    try {
      const response = await axios.get("/api/Clients", { params });

      const data = response.data;

      dispatch(
        requestSuccess({
          clients: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchClientById = async (id: string) => {
    dispatch(requestPending());

    try {
      const response = await axios.get(`/api/Clients/${id}`);

      dispatch(
        setSelectedClient({
          selectedClient: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchClientStats = async (id: string) => {
    dispatch(requestPending());

    try {
      const response = await axios.get(`/api/Clients/${id}/stats`);

      dispatch(
        setStats({
          stats: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createClient = async (data: Partial<IClient>) => {
    dispatch(requestPending());

    try {
      await axios.post("/api/Clients", data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updateClient = async (id: string, data: Partial<IClient>) => {
    dispatch(requestPending());

    try {
      await axios.put(`/api/Clients/${id}`, data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    dispatch(requestPending());

    try {
      await axios.delete(`/api/Clients/${id}`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <ClientStateContext.Provider value={state}>
      <ClientActionContext.Provider
        value={{
          fetchClients,
          fetchClientById,
          fetchClientStats,
          createClient,
          updateClient,
          deleteClient,
        }}
      >
        {children}
      </ClientActionContext.Provider>
    </ClientStateContext.Provider>
  );
};

export const useClientState = () => {
  const context = useContext(ClientStateContext);
  if (!context) {
    throw new Error("useClientState must be used within ClientProvider");
  }
  return context;
};

export const useClientActions = () => {
  const context = useContext(ClientActionContext);
  if (!context) {
    throw new Error("useClientActions must be used within ClientProvider");
  }
  return context;
};
