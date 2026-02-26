"use client";

import { Button, Card, Typography } from "antd";
import { useRouter } from "next/navigation";
import { unauthorizedStyles } from "./unauthorized.styles";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div style={unauthorizedStyles.container}>
      <Card style={unauthorizedStyles.card}>
        <Typography.Title level={3}>Access Denied</Typography.Title>
        <Typography.Paragraph>
          You do not have permission to access this area.
        </Typography.Paragraph>
        <Button type="primary" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
}
