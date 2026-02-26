import { createContext } from "react";

export interface IContact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  isPrimaryContact?: boolean;
  isActive?: boolean;
}

export interface IContactStateContext {
  isPending: boolean;
  isError: boolean;
  contacts: IContact[];
  selectedContact?: IContact;
  totalCount: number;
}

export interface IContactActionContext {
  fetchContacts: (params?: {
    clientId?: string;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchContactsByClient: (clientId: string) => Promise<void>;
  fetchContactById: (id: string) => Promise<void>;

  createContact: (data: Partial<IContact>) => Promise<void>;
  updateContact: (id: string, data: Partial<IContact>) => Promise<void>;
  setPrimaryContact: (id: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IContactStateContext = {
  isPending: false,
  isError: false,
  contacts: [],
  selectedContact: undefined,
  totalCount: 0,
};

export const ContactStateContext =
  createContext<IContactStateContext>(INITIAL_STATE);

const defaultActionContext: IContactActionContext = {
  fetchContacts: async () => {
    throw new Error("ContactProvider not mounted");
  },
  fetchContactsByClient: async () => {
    throw new Error("ContactProvider not mounted");
  },
  fetchContactById: async () => {
    throw new Error("ContactProvider not mounted");
  },
  createContact: async () => {
    throw new Error("ContactProvider not mounted");
  },
  updateContact: async () => {
    throw new Error("ContactProvider not mounted");
  },
  setPrimaryContact: async () => {
    throw new Error("ContactProvider not mounted");
  },
  deleteContact: async () => {
    throw new Error("ContactProvider not mounted");
  },
};

export const ContactActionContext =
  createContext<IContactActionContext>(defaultActionContext);
