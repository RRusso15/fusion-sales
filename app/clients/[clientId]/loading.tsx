"use client";

import { Card, Skeleton, Space } from "antd";

export default function ClientWorkspaceLoading() {
  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    </Space>
  );
}
