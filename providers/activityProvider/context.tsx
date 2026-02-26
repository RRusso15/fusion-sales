import { createContext } from "react";
import {
  ActivityStatusValue,
  ActivityTypeValue,
  PriorityValue,
  RelatedToTypeValue,
} from "@/constants/enums";

export interface IActivity {
  id: string;
  type: ActivityTypeValue;
  subject: string;
  description?: string;
  priority?: PriorityValue;
  status?: ActivityStatusValue;
  dueDate?: string;
  assignedToId?: string;
  relatedToType?: RelatedToTypeValue;
  relatedToId?: string;
  duration?: number;
  location?: string;
  outcome?: string;
}

export interface IActivityStateContext {
  isPending: boolean;
  isError: boolean;
  activities: IActivity[];
  selectedActivity?: IActivity;
  totalCount: number;
}

export interface IActivityActionContext {
  fetchActivities: (params?: {
    assignedToId?: string;
    type?: ActivityTypeValue;
    status?: ActivityStatusValue;
    relatedToType?: RelatedToTypeValue;
    relatedToId?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchActivityById: (id: string) => Promise<void>;

  fetchMyActivities: (params?: {
    status?: ActivityStatusValue;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchUpcomingActivities: (daysAhead?: number) => Promise<void>;
  fetchOverdueActivities: () => Promise<void>;

  createActivity: (data: Partial<IActivity>) => Promise<void>;
  updateActivity: (id: string, data: Partial<IActivity>) => Promise<void>;

  completeActivity: (id: string, outcome: string) => Promise<void>;
  cancelActivity: (id: string) => Promise<void>;

  deleteActivity: (id: string) => Promise<void>;
}

export const INITIAL_STATE: IActivityStateContext = {
  isPending: false,
  isError: false,
  activities: [],
  selectedActivity: undefined,
  totalCount: 0,
};

export const ActivityStateContext =
  createContext<IActivityStateContext>(INITIAL_STATE);

const defaultActionContext: IActivityActionContext = {
  fetchActivities: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  fetchActivityById: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  fetchMyActivities: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  fetchUpcomingActivities: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  fetchOverdueActivities: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  createActivity: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  updateActivity: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  completeActivity: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  cancelActivity: async () => {
    throw new Error("ActivityProvider not mounted");
  },
  deleteActivity: async () => {
    throw new Error("ActivityProvider not mounted");
  },
};

export const ActivityActionContext =
  createContext<IActivityActionContext>(defaultActionContext);
