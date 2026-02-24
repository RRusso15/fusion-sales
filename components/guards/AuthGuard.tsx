"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/authProvider";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "sales" | "admin";
}

export const AuthGuard = ({
  children,
  requiredRole,
}: AuthGuardProps) => {
  const { isAuthenticated, user, isPending } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace("/");
    }
  }, [isAuthenticated, user, requiredRole, router, isPending]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};