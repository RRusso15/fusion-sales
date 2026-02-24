export interface ClientDto {
  id: string;               // uuid
  name?: string | null;
  industry?: string | null;
  companySize?: string | null;
  website?: string | null;
  billingAddress?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
  createdById?: string;
  createdByName?: string | null;
  createdAt: string;       // date-time
  updatedAt: string;       // date-time

  // stats included on client DTO:
  contactsCount?: number;
  opportunitiesCount?: number;
  contractsCount?: number;
}