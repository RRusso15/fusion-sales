"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuthState } from "@/providers/authProvider";

export default function HomePage() {
  const { isAuthenticated, user, isPending } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.roles?.includes("Admin")) {
      router.replace("/admin");
    } else if (user?.roles?.includes("SalesRep")) {
      router.replace("/sales");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, user, isPending, router]);

  return <Spin fullscreen />;
}