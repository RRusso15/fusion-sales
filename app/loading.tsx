"use client";

import { Card, Skeleton, Space } from "antd";

export default function GlobalLoading() {
  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </Space>
  );
}
