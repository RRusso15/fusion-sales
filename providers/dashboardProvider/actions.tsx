import { createAction } from "redux-actions";
import { IDashboardStateContext } from "./context";

export enum DashboardActionEnum {
  requestPending = "DASHBOARD_REQUEST_PENDING",
  requestSuccess = "DASHBOARD_REQUEST_SUCCESS",
  requestError = "DASHBOARD_REQUEST_ERROR",
}

export const requestPending = createAction<
  Partial<IDashboardStateContext>
>(DashboardActionEnum.requestPending, () => ({
  isPending: true,
  isError: false,
}));

export const requestSuccess = createAction<
  Partial<IDashboardStateContext>,
  Partial<IDashboardStateContext>
>(
  DashboardActionEnum.requestSuccess,
  (payload) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<
  Partial<IDashboardStateContext>
>(DashboardActionEnum.requestError, () => ({
  isPending: false,
  isError: true,
}));