import { ActivityStatusValue, ActivityTypeValue } from "@/constants/enums";

export interface ActivityDto {
  id: string;
  title?: string | null;
  description?: string | null;
  opportunityId?: string | null;
  clientId?: string | null;
  assignedToId?: string | null;   // user id
  assignedToName?: string | null;
  dueDate?: string | null;        // date-time
  type?: ActivityTypeValue;
  status?: ActivityStatusValue;
  isOverdue?: boolean;
  participantsCount?: number;
  createdById?: string;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}
