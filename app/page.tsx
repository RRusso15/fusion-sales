"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole } from "@/constants/roles";

export default function HomePage() {
  const { isAuthenticated, user, role, isPending } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const activeRole = role ?? normalizeRole(user?.roles?.[0]);
    if (!activeRole) {
      router.replace("/unauthorized");
      return;
    }

    router.replace("/dashboard");
  }, [isAuthenticated, user, role, isPending, router]);

  return <Spin fullscreen />;
}
