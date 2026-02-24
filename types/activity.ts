export type ActivityType = 1 | 2 | 3 | 4 | 5;   // meeting, call, email, task, etc. (see swagger)
export type ActivityStatus = 1 | 2 | 3;         // pending/completed/cancelled etc.

export interface ActivityDto {
  id: string;
  title?: string | null;
  description?: string | null;
  opportunityId?: string | null;
  clientId?: string | null;
  assignedToId?: string | null;   // user id
  assignedToName?: string | null;
  dueDate?: string | null;        // date-time
  type?: ActivityType;
  status?: ActivityStatus;
  isOverdue?: boolean;
  participantsCount?: number;
  createdById?: string;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}