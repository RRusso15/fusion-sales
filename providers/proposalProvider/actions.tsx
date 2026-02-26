import { createAction } from "redux-actions";
import { IProposalStateContext } from "./context";

export enum ProposalActionEnum {
  requestPending = "PROPOSAL_REQUEST_PENDING",
  requestSuccess = "PROPOSAL_REQUEST_SUCCESS",
  requestError = "PROPOSAL_REQUEST_ERROR",
  setSelectedProposal = "SET_SELECTED_PROPOSAL",
}

export const requestPending = createAction<Partial<IProposalStateContext>>(
  ProposalActionEnum.requestPending,
  () => ({
    isPending: true,
    isError: false,
  })
);

export const requestSuccess = createAction<
  Partial<IProposalStateContext>,
  Partial<IProposalStateContext>
>(
  ProposalActionEnum.requestSuccess,
  (payload) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<Partial<IProposalStateContext>>(
  ProposalActionEnum.requestError,
  () => ({
    isPending: false,
    isError: true,
  })
);

export const setSelectedProposal = createAction<
  Partial<IProposalStateContext>,
  Partial<IProposalStateContext>
>(
  ProposalActionEnum.setSelectedProposal,
  (payload) => payload
);