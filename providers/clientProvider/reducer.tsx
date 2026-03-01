import { handleActions } from "redux-actions";
import { INITIAL_STATE, IClientStateContext } from "./context";
import { ClientActionEnum } from "./actions";

export const ClientReducer = handleActions<
  IClientStateContext,
  Partial<IClientStateContext>
>(
  {
    [ClientActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ClientActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ClientActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ClientActionEnum.setSelectedClient]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ClientActionEnum.setStats]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);