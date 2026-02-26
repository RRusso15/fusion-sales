import { createContext } from "react";

/**
 * Roles supported by frontend.
 * Backend may support more — we only care about these two.
 */
export type UserRole = "Admin" | "SalesRep" | "SalesManager" | "BusinessDevelopmentManager";

export interface IUser {
  id: string; // UUID from API
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[]; // API returns string[]
  role?: UserRole;
  tenantId?: string;
}

export interface IAuthStateContext {
  isPending: boolean;
  isError: boolean;
  isAuthenticated: boolean;
  currentUser?: IUser;
  user?: IUser;
  token?: string;
  role?: UserRole;
  tenantId?: string;
}

export interface IAuthActionContext {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    tenantName?: string;
    tenantId?: string;
    role?: Exclude<UserRole, "Admin">;
  }) => Promise<void>;
}

export const INITIAL_STATE: IAuthStateContext = {
  isPending: false,
  isError: false,
  isAuthenticated: false,
  currentUser: undefined,
  user: undefined,
  token: undefined,
  role: undefined,
  tenantId: undefined,
};

export const AuthStateContext =
  createContext<IAuthStateContext>(INITIAL_STATE);

const defaultActionContext: IAuthActionContext = {
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: () => {
    throw new Error("AuthProvider not mounted");
  },
  register: async () => {
    throw new Error("AuthProvider not mounted");
  },
};

export const AuthActionContext =
  createContext<IAuthActionContext>(defaultActionContext);
