import { createContext } from "react";

export interface IUser {
  id: number;
  name: string;
  email: string;
  role: string;
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
  register: (name: string, email: string, password: string) => Promise<void>;
}

export const INITIAL_STATE: IAuthStateContext = {
  isPending: false,
  isError: false,
  isAuthenticated: false,
  user: undefined,
  token: undefined,
};

export const AuthStateContext = createContext<IAuthStateContext>(INITIAL_STATE);
export const AuthActionContext = createContext<IAuthActionContext>(undefined as any);
