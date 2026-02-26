"use client";

import { Button, Card, Typography } from "antd";
import Link from "next/link";
import { notFoundStyles } from "./not-found.styles";

export default function NotFound() {
  return (
    <div style={notFoundStyles.container}>
      <Card style={notFoundStyles.card}>
        <Typography.Title level={3}>Page Not Found</Typography.Title>
        <Typography.Paragraph>
          The requested page could not be found.
        </Typography.Paragraph>
        <Link href="/">
          <Button type="primary">Go Home</Button>
        </Link>
      </Card>
    </div>
  );
}
