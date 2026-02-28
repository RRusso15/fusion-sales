"use client";

import { Permission, PermissionValue, hasPermission as hasRolePermission } from "@/constants/permissions";
import { normalizeRole } from "@/constants/roles";
import { useAuthState } from "@/providers/authProvider";

export const usePermission = () => {
  const { role, user } = useAuthState();
  const activeRole = role ?? normalizeRole(user?.roles?.[0]);

  const hasPermission = (action: PermissionValue) => {
    return hasRolePermission(activeRole, action);
  };

  return {
    role: activeRole,
    hasPermission,
    Permission,
  };
};
