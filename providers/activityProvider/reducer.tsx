import { handleActions } from "redux-actions";
import { INITIAL_STATE, IActivityStateContext } from "./context";
import { ActivityActionEnum } from "./actions";

export const ActivityReducer = handleActions<
  IActivityStateContext,
  Partial<IActivityStateContext>
>(
  {
    [ActivityActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ActivityActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ActivityActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ActivityActionEnum.setSelectedActivity]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);