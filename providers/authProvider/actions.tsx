import { createAction } from "redux-actions";
import { IAuthStateContext, IUser } from "./context";

export enum AuthActionEnum {
  loginPending = "LOGIN_PENDING",
  loginSuccess = "LOGIN_SUCCESS",
  loginError = "LOGIN_ERROR",

  logout = "LOGOUT",

  registerPending = "REGISTER_PENDING",
  registerSuccess = "REGISTER_SUCCESS",
  registerError = "REGISTER_ERROR",
}

export const loginPending = createAction<Partial<IAuthStateContext>>(
  AuthActionEnum.loginPending,
  () => ({ isPending: true, isError: false })
);

export const loginSuccess = createAction<
  Partial<IAuthStateContext>,
  { user: IUser; token: string }
>(
  AuthActionEnum.loginSuccess,
  ({ user, token }) => ({
    isPending: false,
    isError: false,
    isAuthenticated: true,
    user,
    token,
  })
);

export const loginError = createAction<Partial<IAuthStateContext>>(
  AuthActionEnum.loginError,
  () => ({ isPending: false, isError: true })
);

export const logoutAction = createAction<Partial<IAuthStateContext>>(
  AuthActionEnum.logout,
  () => ({
    isAuthenticated: false,
    user: undefined,
    token: undefined,
  })
);

export const registerPending = createAction<Partial<IAuthStateContext>>(
  AuthActionEnum.registerPending,
  () => ({ isPending: true, isError: false })
);

export const registerSuccess = createAction<
  Partial<IAuthStateContext>,
  { user: IUser; token: string }
>(
  AuthActionEnum.registerSuccess,
  ({ user, token }) => ({
    isPending: false,
    isError: false,
    isAuthenticated: true,
    user,
    token,
  })
);

export const registerError = createAction<Partial<IAuthStateContext>>(
  AuthActionEnum.registerError,
  () => ({ isPending: false, isError: true })
);
