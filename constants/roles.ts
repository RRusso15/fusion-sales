import type { UserRole } from "@/providers/authProvider/context";

export const Roles = {
  Admin: "Admin",
  SalesRep: "SalesRep",
  SalesManager: "SalesManager",
  BusinessDevelopmentManager: "BusinessDevelopmentManager",
} as const;

export type RoleValue = (typeof Roles)[keyof typeof Roles];

const roleKeyMap: Record<string, RoleValue> = {
  admin: Roles.Admin,
  administrator: Roles.Admin,
  tenantadmin: Roles.Admin,
  organizationadmin: Roles.Admin,
  organisationadmin: Roles.Admin,
  superadmin: Roles.Admin,
  systemadmin: Roles.Admin,
  salesrep: Roles.SalesRep,
  salesrepresentative: Roles.SalesRep,
  salesmanager: Roles.SalesManager,
  saleslead: Roles.SalesManager,
  businessdevelopmentmanager: Roles.BusinessDevelopmentManager,
  bdm: Roles.BusinessDevelopmentManager,
};

export const normalizeRole = (value?: string | null): RoleValue | undefined => {
  if (!value) return undefined;
  const key = value.replace(/[\s_-]+/g, "").toLowerCase();
  return roleKeyMap[key];
};

export const resolveUserRole = (
  directRole?: string | null,
  roles?: Array<string | null | undefined>
): RoleValue | undefined => {
  const normalizedDirectRole = normalizeRole(directRole);
  if (normalizedDirectRole) return normalizedDirectRole;

  for (const roleValue of roles ?? []) {
    const normalized = normalizeRole(roleValue);
    if (normalized) return normalized;
  }

  return undefined;
};

export const RoleGroups: Record<string, UserRole[]> = {
  adminOnly: [Roles.Admin],
  salesArea: [
    Roles.Admin,
    Roles.SalesManager,
    Roles.BusinessDevelopmentManager,
    Roles.SalesRep,
  ],
};
