import { createAction } from "redux-actions";
import { IActivityStateContext } from "./context";

export enum ActivityActionEnum {
  requestPending = "ACTIVITY_REQUEST_PENDING",
  requestSuccess = "ACTIVITY_REQUEST_SUCCESS",
  requestError = "ACTIVITY_REQUEST_ERROR",
  setSelectedActivity = "SET_SELECTED_ACTIVITY",
}

export const requestPending = createAction<
  Partial<IActivityStateContext>
>(ActivityActionEnum.requestPending, () => ({
  isPending: true,
  isError: false,
}));

export const requestSuccess = createAction<
  Partial<IActivityStateContext>,
  Partial<IActivityStateContext>
>(
  ActivityActionEnum.requestSuccess,
  (payload) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<
  Partial<IActivityStateContext>
>(ActivityActionEnum.requestError, () => ({
  isPending: false,
  isError: true,
}));

export const setSelectedActivity = createAction<
  Partial<IActivityStateContext>,
  Partial<IActivityStateContext>
>(
  ActivityActionEnum.setSelectedActivity,
  (payload) => payload
);