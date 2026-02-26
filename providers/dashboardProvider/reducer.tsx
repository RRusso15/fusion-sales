import { handleActions } from "redux-actions";
import { INITIAL_STATE, IDashboardStateContext } from "./context";
import { DashboardActionEnum } from "./actions";

export const DashboardReducer = handleActions<
  IDashboardStateContext,
  Partial<IDashboardStateContext>
>(
  {
    [DashboardActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [DashboardActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [DashboardActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);