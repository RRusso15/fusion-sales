import { createContext } from "react";

export interface IActivity {
  id: string;
  type: number;
  subject: string;
  description?: string;
  priority?: number;
  status?: number;
  dueDate?: string;
  assignedToId?: string;
  relatedToType?: number;
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
    type?: number;
    status?: number;
    relatedToType?: number;
    relatedToId?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;

  fetchActivityById: (id: string) => Promise<void>;

  fetchMyActivities: (params?: {
    status?: number;
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

export const ActivityActionContext =
  createContext<IActivityActionContext>(undefined as any);