"use client";

import { useContext, useReducer } from "react";
import {
  INITIAL_STATE,
  IUserRecord,
  IUsersActionContext,
  UsersActionContext,
  UsersStateContext,
} from "./context";
import { UsersReducer } from "./reducer";
import {
  requestError,
  requestPending,
  requestSuccess,
  setSelectedUser,
} from "./actions";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(UsersReducer, INITIAL_STATE);
  const axios = getAxiosInstance();

  const fetchUsers: IUsersActionContext["fetchUsers"] = async (params) => {
    dispatch(requestPending());
    try {
      const response = await axios.get("/api/Users", { params });
      const data = response.data;

      dispatch(
        requestSuccess({
          users: data.items ?? data,
          totalCount: data.totalCount ?? 0,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  const fetchUserById = async (id: string) => {
    dispatch(requestPending());
    try {
      const response = await axios.get(`/api/Users/${id}`);
      dispatch(
        setSelectedUser({
          selectedUser: response.data as IUserRecord,
          isPending: false,
        })
      );
    } catch (error) {
      dispatch(requestError());
      throw error;
    }
  };

  return (
    <UsersStateContext.Provider value={state}>
      <UsersActionContext.Provider
        value={{
          fetchUsers,
          fetchUserById,
        }}
      >
        {children}
      </UsersActionContext.Provider>
    </UsersStateContext.Provider>
  );
};

export const useUsersState = () => {
  const context = useContext(UsersStateContext);
  if (!context) {
    throw new Error("useUsersState must be used within UsersProvider");
  }
  return context;
};

export const useUsersActions = () => {
  const context = useContext(UsersActionContext);
  if (!context) {
    throw new Error("useUsersActions must be used within UsersProvider");
  }
  return context;
};

