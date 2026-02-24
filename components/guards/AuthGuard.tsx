"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/authProvider";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "Admin" | "SalesRep";
}

export const AuthGuard = ({
  children,
  requiredRole,
}: AuthGuardProps) => {
  const { isAuthenticated, user, isPending } = useAuthState();
  const router = useRouter();

  const hasRequiredRole = () => {
    if (!requiredRole) return true;
    return user?.roles?.includes(requiredRole);
  };

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole()) {
      router.replace("/");
    }
  }, [isAuthenticated, user, requiredRole, router, isPending]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasRequiredRole()) {
    return null;
  }

  return <>{children}</>;
};