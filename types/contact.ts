export interface ContactDto {
  id: string;
  clientId: string;
  clientName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  position?: string | null;
  isPrimaryContact: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}