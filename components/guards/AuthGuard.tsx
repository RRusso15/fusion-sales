"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/authProvider";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const AuthGuard = ({
  children,
  requiredRoles,
}: AuthGuardProps) => {
  const { isAuthenticated, user, isPending } = useAuthState();
  const router = useRouter();

  const hasRequiredRole = () => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some((role) =>
      user?.roles?.includes(role)
    );
  };

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole()) {
      router.replace("/"); // 
    }
  }, [isAuthenticated, user, requiredRoles, router, isPending]);

  if (isPending) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  if (!hasRequiredRole()) return null;

  return <>{children}</>;
};