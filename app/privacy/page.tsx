"use client";

import { Button, Typography } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";

export default function AdminPage() {
  const { user } = useAuthState();
  const { logout } = useAuthActions();

  return (
    <>
      <Typography.Title level={2}>
        Privacy Policy
      </Typography.Title>

      <Typography.Paragraph>
        Lorem Ipsum is a dummy or placeholder text commonly used in graphic design, 
        publishing, and web development to fill spaces where content will eventually 
        appear, allowing designers to focus on layout and typography without distraction 
        from meaningful text. It is typically nonsensical Latin, derived from classical
        literature, and does not convey actual meaning.
      </Typography.Paragraph>
    </>
  );
}