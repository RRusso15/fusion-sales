import { createAction } from "redux-actions";
import { IContactStateContext } from "./context";

export enum ContactActionEnum {
  requestPending = "CONTACT_REQUEST_PENDING",
  requestSuccess = "CONTACT_REQUEST_SUCCESS",
  requestError = "CONTACT_REQUEST_ERROR",
  setSelectedContact = "SET_SELECTED_CONTACT",
}

/**
 * Pending
 */
export const requestPending = createAction<Partial<IContactStateContext>>(
  ContactActionEnum.requestPending,
  () => ({
    isPending: true,
    isError: false,
  })
);

/**
 * Success
 */
export const requestSuccess = createAction<
  Partial<IContactStateContext>,
  Partial<IContactStateContext>
>(
  ContactActionEnum.requestSuccess,
  (payload: Partial<IContactStateContext>) => ({
    isPending: false,
    isError: false,
    ...payload,
  })
);

/**
 * Error
 */
export const requestError = createAction<Partial<IContactStateContext>>(
  ContactActionEnum.requestError,
  () => ({
    isPending: false,
    isError: true,
  })
);

/**
 * Selected contact
 */
export const setSelectedContact = createAction<
  Partial<IContactStateContext>,
  Partial<IContactStateContext>
>(
  ContactActionEnum.setSelectedContact,
  (payload: Partial<IContactStateContext>) => payload
);