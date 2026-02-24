export type Role = "admin" | "sales" | string;

export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  roles?: Role[] | null;
}