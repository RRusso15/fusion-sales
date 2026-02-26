import { createAction } from "redux-actions";
import { IContractStateContext } from "./context";

export enum ContractActionEnum {
  requestPending = "CONTRACT_REQUEST_PENDING",
  requestSuccess = "CONTRACT_REQUEST_SUCCESS",
  requestError = "CONTRACT_REQUEST_ERROR",
  setSelectedContract = "SET_SELECTED_CONTRACT",
}

export const requestPending = createAction<Partial<IContractStateContext>>(
  ContractActionEnum.requestPending,
  () => ({
    isPending: true,
    isError: false,
  })
);

export const requestSuccess = createAction<
  Partial<IContractStateContext>,
  Partial<IContractStateContext>
>(
  ContractActionEnum.requestSuccess,
  (payload) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<Partial<IContractStateContext>>(
  ContractActionEnum.requestError,
  () => ({
    isPending: false,
    isError: true,
  })
);

export const setSelectedContract = createAction<
  Partial<IContractStateContext>,
  Partial<IContractStateContext>
>(
  ContractActionEnum.setSelectedContract,
  (payload) => payload
);