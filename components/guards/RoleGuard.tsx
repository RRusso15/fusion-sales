"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/authProvider";
import { UserRole } from "@/providers/authProvider/context";
import { normalizeRole } from "@/constants/roles";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleGuard = ({
  children,
  allowedRoles,
  redirectTo = "/unauthorized",
}: RoleGuardProps) => {
  const { isAuthenticated, isPending, role, user } = useAuthState();
  const router = useRouter();

  const activeRole =
    role ??
    normalizeRole(user?.roles?.[0]) ??
    (user?.roles?.[0] as UserRole | undefined);
  const isAuthorized = !!activeRole && allowedRoles.includes(activeRole);

  useEffect(() => {
    if (isPending) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isAuthorized) {
      router.replace(redirectTo);
    }
  }, [isPending, isAuthenticated, isAuthorized, redirectTo, router]);

  if (isPending || !isAuthenticated || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
