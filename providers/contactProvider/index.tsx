"use client";

import { useReducer, useContext } from "react";
import {
  INITIAL_STATE,
  ContactStateContext,
  ContactActionContext,
  IContact,
} from "./context";
import { ContactReducer } from "./reducer";
import {
  requestPending,
  requestSuccess,
  requestError,
  setSelectedContact,
} from "./actions";

import { getAxiosInstance } from "@/utils/axiosInstance";

export const ContactProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(ContactReducer, INITIAL_STATE);
  const axios = getAxiosInstance();

  /**
   * GET /api/contacts
   */
  const fetchContacts = async (params?: any) => {
    dispatch(requestPending());

    try {
      const response = await axios.get("/api/Contacts", { params });
      const data = response.data;

      dispatch(
        requestSuccess({
          contacts: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  /**
   * GET /api/contacts/by-client/{clientId}
   */
  const fetchContactsByClient = async (clientId: string) => {
    dispatch(requestPending());

    try {
      const response = await axios.get(
        `/api/Contacts/by-client/${clientId}`
      );

      dispatch(
        requestSuccess({
          contacts: response.data,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  /**
   * GET /api/contacts/{id}
   */
  const fetchContactById = async (id: string) => {
    dispatch(requestPending());

    try {
      const response = await axios.get(`/api/Contacts/${id}`);

      dispatch(
        setSelectedContact({
          selectedContact: response.data,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  /**
   * POST /api/contacts
   */
  const createContact = async (data: Partial<IContact>) => {
    dispatch(requestPending());

    try {
      await axios.post("/api/Contacts", data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  /**
   * PUT /api/contacts/{id}
   */
  const updateContact = async (id: string, data: Partial<IContact>) => {
    dispatch(requestPending());

    try {
      await axios.put(`/api/Contacts/${id}`, data);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  /**
   * PUT /api/contacts/{id}/set-primary
   */
  const setPrimaryContact = async (id: string) => {
    dispatch(requestPending());

    try {
      await axios.put(`/api/Contacts/${id}/set-primary`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  /**
   * DELETE /api/contacts/{id}
   */
  const deleteContact = async (id: string) => {
    dispatch(requestPending());

    try {
      await axios.delete(`/api/Contacts/${id}`);
      dispatch(requestSuccess({}));
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <ContactStateContext.Provider value={state}>
      <ContactActionContext.Provider
        value={{
          fetchContacts,
          fetchContactsByClient,
          fetchContactById,
          createContact,
          updateContact,
          setPrimaryContact,
          deleteContact,
        }}
      >
        {children}
      </ContactActionContext.Provider>
    </ContactStateContext.Provider>
  );
};

export const useContactState = () => {
  const context = useContext(ContactStateContext);
  if (!context) {
    throw new Error("useContactState must be used within ContactProvider");
  }
  return context;
};

export const useContactActions = () => {
  const context = useContext(ContactActionContext);
  if (!context) {
    throw new Error("useContactActions must be used within ContactProvider");
  }
  return context;
};