import { createAction } from "redux-actions";
import { IPricingStateContext } from "./context";

export enum PricingActionEnum {
  requestPending = "PRICING_REQUEST_PENDING",
  requestSuccess = "PRICING_REQUEST_SUCCESS",
  requestError = "PRICING_REQUEST_ERROR",
  setSelectedPricingRequest = "SET_SELECTED_PRICING_REQUEST",
}

export const requestPending = createAction<
  Partial<IPricingStateContext>
>(PricingActionEnum.requestPending, () => ({
  isPending: true,
  isError: false,
}));

export const requestSuccess = createAction<
  Partial<IPricingStateContext>,
  Partial<IPricingStateContext>
>(
  PricingActionEnum.requestSuccess,
  (payload) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<
  Partial<IPricingStateContext>
>(PricingActionEnum.requestError, () => ({
  isPending: false,
  isError: true,
}));

export const setSelectedPricingRequest = createAction<
  Partial<IPricingStateContext>,
  Partial<IPricingStateContext>
>(
  PricingActionEnum.setSelectedPricingRequest,
  (payload) => payload
);