"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  ProposalStateContext,
  ProposalActionContext,
  IProposal,
  IProposalActionContext,
} from "./context";
import { ProposalReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedProposal,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const ProposalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    ProposalReducer,
    INITIAL_STATE
  );
  const axios = getAxiosInstance();

  const fetchProposals: IProposalActionContext["fetchProposals"] = async (
    params
  ) => {
    dispatch(requestPending());
    try {
      const response = await axios.get("/api/Proposals", {
        params,
      });
      const data = response.data;
      dispatch(
        requestSuccess({
          proposals: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchProposalById = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(
        `/api/Proposals/${id}`
      );
      dispatch(
        setSelectedProposal({
          selectedProposal: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const createProposal = async (data: Partial<IProposal>) => {
    dispatch(requestPending());
    try {
      await axios.post("/api/Proposals", data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updateProposal = async (
    id: string,
    data: Partial<IProposal>
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Proposals/${id}`, data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const addLineItem: IProposalActionContext["addLineItem"] = async (
    proposalId,
    data
  ) => {
    dispatch(requestPending());
    try {
      await axios.post(
        `/api/Proposals/${proposalId}/line-items`,
        data
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const updateLineItem: IProposalActionContext["updateLineItem"] = async (
    proposalId,
    lineItemId,
    data
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(
        `/api/Proposals/${proposalId}/line-items/${lineItemId}`,
        data
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const deleteLineItem: IProposalActionContext["deleteLineItem"] = async (
    proposalId,
    lineItemId
  ) => {
    dispatch(requestPending());
    try {
      await axios.delete(
        `/api/Proposals/${proposalId}/line-items/${lineItemId}`
      );
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const submitProposal: IProposalActionContext["submitProposal"] = async (
    id
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Proposals/${id}/submit`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const approveProposal: IProposalActionContext["approveProposal"] = async (
    id
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Proposals/${id}/approve`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const rejectProposal: IProposalActionContext["rejectProposal"] = async (
    id,
    reason
  ) => {
    dispatch(requestPending());
    try {
      await axios.put(`/api/Proposals/${id}/reject`, {
        reason,
      });
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const deleteProposal = async (id: string) => {
    dispatch(requestPending());
    try {
      await axios.delete(`/api/Proposals/${id}`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <ProposalStateContext.Provider value={state}>
      <ProposalActionContext.Provider
        value={{
          fetchProposals,
          fetchProposalById,
          createProposal,
          updateProposal,
          addLineItem,
          updateLineItem,
          deleteLineItem,
          submitProposal,
          approveProposal,
          rejectProposal,
          deleteProposal,
        }}
      >
        {children}
      </ProposalActionContext.Provider>
    </ProposalStateContext.Provider>
  );
};

export const useProposalState = () => {
  const context = useContext(ProposalStateContext);
  if (!context) {
    throw new Error(
      "useProposalState must be used within ProposalProvider"
    );
  }
  return context;
};

export const useProposalActions = () => {
  const context = useContext(ProposalActionContext);
  if (!context) {
    throw new Error(
      "useProposalActions must be used within ProposalProvider"
    );
  }
  return context;
};
