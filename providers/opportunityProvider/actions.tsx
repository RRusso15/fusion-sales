import { createAction } from "redux-actions";
import { IOpportunityStateContext } from "./context";

export enum OpportunityActionEnum {
  requestPending = "OPPORTUNITY_REQUEST_PENDING",
  requestSuccess = "OPPORTUNITY_REQUEST_SUCCESS",
  requestError = "OPPORTUNITY_REQUEST_ERROR",
  setSelectedOpportunity = "SET_SELECTED_OPPORTUNITY",
  setStageHistory = "SET_STAGE_HISTORY",
  setPipeline = "SET_PIPELINE",
}

export const requestPending = createAction<Partial<IOpportunityStateContext>>(
  OpportunityActionEnum.requestPending,
  () => ({
    isPending: true,
    isError: false,
  })
);

export const requestSuccess = createAction<
  Partial<IOpportunityStateContext>,
  Partial<IOpportunityStateContext>
>(
  OpportunityActionEnum.requestSuccess,
  (payload: Partial<IOpportunityStateContext>) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<Partial<IOpportunityStateContext>>(
  OpportunityActionEnum.requestError,
  () => ({
    isPending: false,
    isError: true,
  })
);

export const setSelectedOpportunity = createAction<
  Partial<IOpportunityStateContext>,
  Partial<IOpportunityStateContext>
>(
  OpportunityActionEnum.setSelectedOpportunity,
  (payload) => payload
);

export const setStageHistory = createAction<
  Partial<IOpportunityStateContext>,
  Partial<IOpportunityStateContext>
>(
  OpportunityActionEnum.setStageHistory,
  (payload) => payload
);

export const setPipeline = createAction<
  Partial<IOpportunityStateContext>,
  Partial<IOpportunityStateContext>
>(
  OpportunityActionEnum.setPipeline,
  (payload) => payload
);