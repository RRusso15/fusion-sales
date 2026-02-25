"use client";

import { Button, Typography } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";

export default function SalesPage() {
  const { user } = useAuthState();
  const { logout } = useAuthActions();
  console.log("User:", user);

  return (
    <>
      <Typography.Title level={2}>
        Sales Dashboard
      </Typography.Title>

      <Typography.Paragraph>
        Welcome {user?.firstName} ({user?.roles?.join(", ")})
      </Typography.Paragraph>

      <Button danger onClick={logout}>
        Logout
      </Button>
    </>
  );
}