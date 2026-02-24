import { handleActions } from "redux-actions";
import { INITIAL_STATE, IAuthStateContext } from "./context";
import { AuthActionEnum } from "./actions";

export const AuthReducer = handleActions<
  IAuthStateContext,
  Partial<IAuthStateContext>
>(
  {
    [AuthActionEnum.loginPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [AuthActionEnum.loginSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [AuthActionEnum.loginError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    [AuthActionEnum.logout]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    [AuthActionEnum.registerPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [AuthActionEnum.registerSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [AuthActionEnum.registerError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);
