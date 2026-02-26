import { handleActions } from "redux-actions";
import { INITIAL_STATE, IPricingStateContext } from "./context";
import { PricingActionEnum } from "./actions";

export const PricingReducer = handleActions<
  IPricingStateContext,
  Partial<IPricingStateContext>
>(
  {
    [PricingActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [PricingActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [PricingActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [PricingActionEnum.setSelectedPricingRequest]: (
      state,
      action
    ) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);