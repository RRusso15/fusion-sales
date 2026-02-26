import { createAction } from "redux-actions";
import { IClientStateContext } from "./context";

export enum ClientActionEnum {
  requestPending = "CLIENT_REQUEST_PENDING",
  requestSuccess = "CLIENT_REQUEST_SUCCESS",
  requestError = "CLIENT_REQUEST_ERROR",
  setSelectedClient = "SET_SELECTED_CLIENT",
  setStats = "SET_CLIENT_STATS",
}

/**
 * Pending
 */
export const requestPending = createAction<Partial<IClientStateContext>>(
  ClientActionEnum.requestPending,
  () => ({
    isPending: true,
    isError: false,
  })
);

/**
 * Success
 * IMPORTANT: we explicitly type the payload parameter
 */
export const requestSuccess = createAction<
  Partial<IClientStateContext>,
  Partial<IClientStateContext>
>(
  ClientActionEnum.requestSuccess,
  (payload: Partial<IClientStateContext>) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

/**
 * Error
 */
export const requestError = createAction<Partial<IClientStateContext>>(
  ClientActionEnum.requestError,
  () => ({
    isPending: false,
    isError: true,
  })
);

/**
 * Selected client
 */
export const setSelectedClient = createAction<
  Partial<IClientStateContext>,
  Partial<IClientStateContext>
>(
  ClientActionEnum.setSelectedClient,
  (payload: Partial<IClientStateContext>) => payload
);

/**
 * Stats
 */
export const setStats = createAction<
  Partial<IClientStateContext>,
  Partial<IClientStateContext>
>(
  ClientActionEnum.setStats,
  (payload: Partial<IClientStateContext>) => payload
);