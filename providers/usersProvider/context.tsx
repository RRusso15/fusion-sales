import { createContext } from "react";
import type { RoleValue } from "@/constants/roles";

export interface IUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export interface IUsersStateContext {
  isPending: boolean;
  isError: boolean;
  users: IUserRecord[];
  selectedUser?: IUserRecord;
  totalCount: number;
}

export interface IUsersActionContext {
  fetchUsers: (params?: {
    pageNumber?: number;
    pageSize?: number;
    role?: RoleValue;
    searchTerm?: string;
    isActive?: boolean;
  }) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IUsersStateContext = {
  isPending: false,
  isError: false,
  users: [],
  selectedUser: undefined,
  totalCount: 0,
};

export const UsersStateContext =
  createContext<IUsersStateContext>(INITIAL_STATE);

const defaultActionContext: IUsersActionContext = {
  fetchUsers: async () => {
    throw new Error("UsersProvider not mounted");
  },
  fetchUserById: async () => {
    throw new Error("UsersProvider not mounted");
  },
};

export const UsersActionContext =
  createContext<IUsersActionContext>(defaultActionContext);

