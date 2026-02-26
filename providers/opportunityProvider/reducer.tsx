import { handleActions } from "redux-actions";
import { INITIAL_STATE, IOpportunityStateContext } from "./context";
import { OpportunityActionEnum } from "./actions";

export const OpportunityReducer = handleActions<
  IOpportunityStateContext,
  Partial<IOpportunityStateContext>
>(
  {
    [OpportunityActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [OpportunityActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [OpportunityActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [OpportunityActionEnum.setSelectedOpportunity]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [OpportunityActionEnum.setStageHistory]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [OpportunityActionEnum.setPipeline]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);