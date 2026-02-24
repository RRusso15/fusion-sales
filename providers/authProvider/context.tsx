import { createContext } from "react";

/**
 * Roles supported by frontend.
 * Backend may support more — we only care about these two.
 */
export type UserRole = "Admin" | "SalesRep";

export interface IUser {
  id: string; // UUID from API
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[]; // API returns string[]
}

export interface IAuthStateContext {
  isPending: boolean;
  isError: boolean;
  isAuthenticated: boolean;
  user?: IUser;
  token?: string;
}

export interface IAuthActionContext {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
}

export const INITIAL_STATE: IAuthStateContext = {
  isPending: false,
  isError: false,
  isAuthenticated: false,
  user: undefined,
  token: undefined,
};

export const AuthStateContext =
  createContext<IAuthStateContext>(INITIAL_STATE);

export const AuthActionContext =
  createContext<IAuthActionContext>(undefined as any);