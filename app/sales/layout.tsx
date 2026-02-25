"use client";

import { Layout } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="SalesRep">
      <Layout style={{ minHeight: "100vh" }}>
        <Layout.Content style={{ padding: 40 }}>
          {children}
        </Layout.Content>
      </Layout>
    </AuthGuard>
  );
}