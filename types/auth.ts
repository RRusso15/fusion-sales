export interface LoginResponseDto {
  token?: string | null;
  userId: string;            // uuid
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[] | null;   // e.g. ["admin","sales"]
  expiresAt: string;        // date-time
}