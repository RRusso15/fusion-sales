"use client";

import { useReducer, useContext, useEffect, useCallback } from "react";
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
import { normalizeRole } from "@/constants/roles";
import { UserRole } from "./context";

interface AuthApiPayload {
  token?: string;
  accessToken?: string;
  tenantId?: string;
  userId?: string;
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    role?: string;
    tenantId?: string;
  };
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  role?: string;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);
  const axios = getAxiosInstance();

  const parseTokenPayload = useCallback((token?: string) => {
    if (!token) return null;
    try {
      const base64Payload = token.split(".")[1];
      const normalizedPayload = base64Payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
      return JSON.parse(Buffer.from(normalizedPayload, "base64").toString("utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, []);

  const resolveRole = useCallback((roles?: string[], role?: string): IUser["role"] => {
    const directRole = normalizeRole(role);
    if (directRole) return directRole;

    for (const roleItem of roles ?? []) {
      const normalized = normalizeRole(roleItem);
      if (normalized) return normalized;
    }

    return undefined;
  }, []);

  const mapAuthData = useCallback((payload: AuthApiPayload, tokenFromState?: string) => {
    const data = payload?.user ?? payload;
    const token: string = payload?.token ?? payload?.accessToken ?? tokenFromState ?? "";
    const tokenPayload = parseTokenPayload(token);
    const tokenRole =
      typeof tokenPayload?.role === "string"
        ? tokenPayload.role
        : typeof tokenPayload?.[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] === "string"
        ? String(
            tokenPayload[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ]
          )
        : undefined;
    const role = resolveRole(data?.roles, data?.role ?? tokenRole);
    const tenantId: string | undefined =
      data?.tenantId ??
      payload?.tenantId ??
      (typeof tokenPayload?.tenantId === "string"
        ? tokenPayload.tenantId
        : typeof tokenPayload?.[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/tenantid"
          ] === "string"
        ? String(
            tokenPayload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/tenantid"
            ]
          )
        : undefined);

    const user: IUser = {
      id: String(data?.id ?? payload?.userId ?? ""),
      email: data?.email,
      firstName: data?.firstName,
      lastName: data?.lastName,
      roles: data?.roles?.map((item) => normalizeRole(item) ?? item),
      role,
      tenantId,
    };

    return { user, token, role, tenantId };
  }, [parseTokenPayload, resolveRole]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthCookie();

      if (!token) {
        dispatch(logoutAction());
        return;
      }

      try {
        const response = await axios.get("/api/auth/me");
        const data = mapAuthData(response.data, token);

        dispatch(loginSuccess({ ...data, token: token || data.token }));
      } catch {
        removeAuthCookie();
        dispatch(logoutAction());
      }
    };

    initializeAuth();
  }, [axios, mapAuthData]);

  const login = async (email: string, password: string) => {
    dispatch(loginPending());

    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      const data = mapAuthData(response.data);
      if (!data.token) {
        throw new Error("Login response missing token");
      }

      setAuthCookie(data.token);
      dispatch(loginSuccess(data));
      const meResponse = await axios.get("/api/auth/me");
      const meData = mapAuthData(meResponse.data, data.token);
      dispatch(
        loginSuccess({
          ...meData,
          token: data.token,
          role: meData.role ?? data.role,
          tenantId: meData.tenantId ?? data.tenantId,
        })
      );
    } catch (error) {
      dispatch(loginError());
      throw error;
    }
  };

  const register = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    tenantName?: string;
    tenantId?: string;
    role?: Exclude<UserRole, "Admin">;
  }) => {
    dispatch(registerPending());

    try {
      const response = await axios.post("/api/auth/register", payload);

      const data = mapAuthData(response.data);
      if (!data.token) {
        throw new Error("Register response missing token");
      }

      setAuthCookie(data.token);
      dispatch(registerSuccess(data));
      const meResponse = await axios.get("/api/auth/me");
      const meData = mapAuthData(meResponse.data, data.token);
      dispatch(
        registerSuccess({
          ...meData,
          token: data.token,
          role: meData.role ?? data.role,
          tenantId: meData.tenantId ?? data.tenantId,
        })
      );
    } catch (error) {
      dispatch(registerError());
      throw error;
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
