import { handleActions } from "redux-actions";
import { INITIAL_STATE, IContractStateContext } from "./context";
import { ContractActionEnum } from "./actions";

export const ContractReducer = handleActions<
  IContractStateContext,
  Partial<IContractStateContext>
>(
  {
    [ContractActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ContractActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ContractActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ContractActionEnum.setSelectedContract]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);