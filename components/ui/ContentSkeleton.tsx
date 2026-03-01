"use client";

import { Card, Skeleton, Space } from "antd";

type ContentSkeletonVariant = "table" | "cards" | "form";

export function ContentSkeleton({ variant }: { variant: ContentSkeletonVariant }) {
  if (variant === "cards") {
    return (
      <Space orientation="vertical" size={16} style={{ width: "100%" }} className="fade-in">
        <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
        <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
      </Space>
    );
  }

  if (variant === "form") {
    return (
      <Card className="fade-in">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }} className="fade-in">
      <Card><Skeleton active paragraph={{ rows: 2 }} /></Card>
      <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
    </Space>
  );
}

