import { createAction } from "redux-actions";
import { IUsersStateContext } from "./context";

export enum UsersActionEnum {
  requestPending = "USERS_REQUEST_PENDING",
  requestSuccess = "USERS_REQUEST_SUCCESS",
  requestError = "USERS_REQUEST_ERROR",
  setSelectedUser = "SET_SELECTED_USER",
}

export const requestPending = createAction<Partial<IUsersStateContext>>(
  UsersActionEnum.requestPending,
  () => ({
    isPending: true,
    isError: false,
  })
);

export const requestSuccess = createAction<
  Partial<IUsersStateContext>,
  Partial<IUsersStateContext>
>(
  UsersActionEnum.requestSuccess,
  (payload: Partial<IUsersStateContext>) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

export const requestError = createAction<Partial<IUsersStateContext>>(
  UsersActionEnum.requestError,
  () => ({
    isPending: false,
    isError: true,
  })
);

export const setSelectedUser = createAction<
  Partial<IUsersStateContext>,
  Partial<IUsersStateContext>
>(UsersActionEnum.setSelectedUser, (payload) => payload);

