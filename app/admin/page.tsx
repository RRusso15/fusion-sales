"use client";

import { Button, Typography } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";

export default function AdminPage() {
  const { user } = useAuthState();
  const { logout } = useAuthActions();

  return (
    <>
      <Typography.Title level={2}>
        Admin Dashboard
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