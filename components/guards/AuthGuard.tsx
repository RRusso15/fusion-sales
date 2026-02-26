"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/authProvider";
import { UserRole } from "@/providers/authProvider/context";
import { normalizeRole } from "@/constants/roles";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export const AuthGuard = ({
  children,
  requiredRole,
  requiredRoles,
  redirectTo = "/",
}: AuthGuardProps) => {
  const { isAuthenticated, user, role, isPending } = useAuthState();
  const router = useRouter();

  const combinedRoles = requiredRoles ?? (requiredRole ? [requiredRole] : []);
  const normalizedRoles = (user?.roles ?? [])
    .map((value) => normalizeRole(value))
    .filter((value): value is UserRole => !!value);

  const hasRequiredRole =
    combinedRoles.length === 0 ||
    (role ? combinedRoles.includes(role) : false) ||
    combinedRoles.some((allowedRole) => normalizedRoles.includes(allowedRole));

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, hasRequiredRole, router, isPending, redirectTo]);

  if (isPending) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  if (!hasRequiredRole) return null;

  return <>{children}</>;
};
