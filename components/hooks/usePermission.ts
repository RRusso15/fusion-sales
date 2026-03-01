"use client";

import { Permission, PermissionValue, hasPermission as hasRolePermission } from "@/constants/permissions";
import { resolveUserRole } from "@/constants/roles";
import { useAuthState } from "@/providers/authProvider";

export const usePermission = () => {
  const { role, user } = useAuthState();
  const activeRole = resolveUserRole(role, user?.roles);

  const hasPermission = (action: PermissionValue) => {
    return hasRolePermission(activeRole, action);
  };

  return {
    role: activeRole,
    hasPermission,
    Permission,
  };
};
