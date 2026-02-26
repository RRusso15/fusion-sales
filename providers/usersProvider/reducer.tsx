import { handleActions } from "redux-actions";
import { INITIAL_STATE, IUsersStateContext } from "./context";
import { UsersActionEnum } from "./actions";

export const UsersReducer = handleActions<
  IUsersStateContext,
  Partial<IUsersStateContext>
>(
  {
    [UsersActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [UsersActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [UsersActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [UsersActionEnum.setSelectedUser]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);

