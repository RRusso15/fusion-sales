import { handleActions } from "redux-actions";
import { INITIAL_STATE, IContactStateContext } from "./context";
import { ContactActionEnum } from "./actions";

export const ContactReducer = handleActions<
  IContactStateContext,
  Partial<IContactStateContext>
>(
  {
    [ContactActionEnum.requestPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ContactActionEnum.requestSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ContactActionEnum.requestError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [ContactActionEnum.setSelectedContact]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);