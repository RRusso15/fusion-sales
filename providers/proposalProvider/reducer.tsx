import { handleActions } from "redux-actions";
import { INITIAL_STATE, IProposalStateContext } from "./context";
import { ProposalActionEnum } from "./actions";

export const ProposalReducer = handleActions<
  IProposalStateContext,
  Partial<IProposalStateContext>
>(
  {
    [ProposalActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ProposalActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ProposalActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ProposalActionEnum.setSelectedProposal]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);