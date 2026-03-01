"use client";

import { Layout } from "antd";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { RoleGroups } from "@/constants/roles";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={RoleGroups.salesArea}>
      <Layout style={{ minHeight: "100vh" }}>
        <Layout.Content style={{ padding: 40 }}>
          {children}
        </Layout.Content>
      </Layout>
    </RoleGuard>
  );
}
