"use client";

import { useReducer, useContext, useEffect } from "react";
import {
  INITIAL_STATE,
  AuthStateContext,
  AuthActionContext,
  IUser,
} from "./context";
import { AuthReducer } from "./reducer";
import {
  loginPending,
  loginSuccess,
  loginError,
  logoutAction,
  registerPending,
  registerSuccess,
  registerError,
} from "./actions";

import {
  setAuthCookie,
  removeAuthCookie,
  getAuthCookie,
} from "@/utils/cookie";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);
  const axios = getAxiosInstance();

  /**
   * On App Load:
   * 1. Check token in cookie
   * 2. If exists → call /api/Auth/me
   * 3. Restore session if valid
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthCookie();

      if (!token) return;

      try {
        const response = await axios.get("/api/Auth/me");

        const data = response.data;

        const user: IUser = {
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          roles: data.roles,
        };

        dispatch(loginSuccess({ user, token }));
      } catch (error) {
        // Token invalid or expired
        removeAuthCookie();
        dispatch(logoutAction());
      }
    };

    initializeAuth();
  }, []);

  /**
   * LOGIN
   */
  const login = async (email: string, password: string) => {
    dispatch(loginPending());

    try {
      const response = await axios.post("/api/Auth/login", {
        email,
        password,
      });

      const data = response.data;

      const token = data.token;

      const user: IUser = {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles,
      };

      setAuthCookie(token);

      dispatch(loginSuccess({ user, token }));
    } catch (error) {
      dispatch(loginError());
      throw error;
    }
  };

  /**
   * REGISTER
   */
  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    dispatch(registerPending());

    try {
      const response = await axios.post("/api/Auth/register", {
        firstName,
        lastName,
        email,
        password,
      });

      const data = response.data;

      const token = data.token;

      const user: IUser = {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles,
      };

      setAuthCookie(token);

      dispatch(registerSuccess({ user, token }));
    } catch (error) {
      dispatch(registerError());
      throw error;
    }
  };

  /**
   * LOGOUT
   */
  const logout = () => {
    removeAuthCookie();
    dispatch(logoutAction());
  };

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionContext.Provider value={{ login, logout, register }}>
        {children}
      </AuthActionContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error("useAuthState must be used within AuthProvider");
  }
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionContext);
  if (!context) {
    throw new Error("useAuthActions must be used within AuthProvider");
  }
  return context;
};