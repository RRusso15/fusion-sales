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

import { setAuthCookie, removeAuthCookie, getAuthCookie } from "@/utils/cookie";
import { getAxiosInstance } from "@/utils/axiosInstance";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    const token = getAuthCookie();

    if (token) {
      // In real API scenario, we would fetch user from backend
      const mockUser: IUser = {
        id: 1,
        name: "Persisted User",
        email: "persisted@email.com",
        role: "user",
      };

      dispatch(loginSuccess({ user: mockUser, token }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    dispatch(loginPending());

    try {
      // Temporary mock logic until API arrives
      if (!email || !password) {
        throw new Error("Invalid credentials");
      }

      // Simulate API response shape (flexible)
      const mockResponse = {
        user: {
          id: 1,
          name: "John Doe",
          email,
          role: email.includes("admin") ? "admin" : "user",
        },
        token: "mock-jwt-token",
      };

      const { user, token } = mockResponse;
      /*
      const axios = getAxiosInstance();
        const response = await axios.post("/auth/login", {
        email,
        password,
        });

        const { user, token } = response.data;
      */

      setAuthCookie(token);

      dispatch(loginSuccess({ user, token }));
    } catch (error) {
      dispatch(loginError());
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    dispatch(registerPending());

    try {
      const mockResponse = {
        user: {
          id: Date.now(),
          name,
          email,
          role: "user",
        },
        token: "mock-jwt-token",
      };

      const { user, token } = mockResponse;

      setAuthCookie(token);

      dispatch(registerSuccess({ user, token }));
    } catch {
      dispatch(registerError());
    }
  };

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