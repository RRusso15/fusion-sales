"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button, Card, Col, Row, Typography } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { normalizeRole, Roles } from "@/constants/roles";
import {
  DashboardProvider,
  useDashboardActions,
  useDashboardState,
} from "@/providers/dashboardProvider";
import { capabilityStyles } from "../capability.styles";

const DashboardContent = () => {
  const { role, user } = useAuthState();
  const { logout } = useAuthActions();
  const { overview, salesPerformance } = useDashboardState();
  const {
    fetchOverview,
    fetchActivitiesSummary,
    fetchContractsExpiring,
    fetchSalesPerformance,
  } = useDashboardActions();
  const loadedRef = useRef(false);
  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const salesPerformanceList = Array.isArray(salesPerformance)
    ? salesPerformance
    : [];

  const load = useCallback(async () => {
    const jobs: Promise<void>[] = [
      fetchOverview(),
      fetchActivitiesSummary(),
      fetchContractsExpiring(30),
    ];
    if (activeRole === Roles.Admin || activeRole === Roles.SalesManager) {
      jobs.push(fetchSalesPerformance(5));
    }
    await Promise.all(jobs);
  }, [
    activeRole,
    fetchActivitiesSummary,
    fetchContractsExpiring,
    fetchOverview,
    fetchSalesPerformance,
  ]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  return (
    <div style={capabilityStyles.container}>
      <Card style={capabilityStyles.header}>
        <div style={capabilityStyles.actions}>
          <Button onClick={() => load()}>Refresh</Button>
          <Button danger onClick={logout}>
            Logout
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={capabilityStyles.cardsRow}>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Pipeline Value</Typography.Text>
            <Typography.Title level={4}>
              {overview?.opportunities?.pipelineValue?.toLocaleString?.() ?? 0}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Open Opportunities</Typography.Text>
            <Typography.Title level={4}>
              {overview?.opportunities?.totalCount ?? 0}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Upcoming Activities</Typography.Text>
            <Typography.Title level={4}>
              {overview?.activities?.upcomingCount ?? 0}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Active Contracts</Typography.Text>
            <Typography.Title level={4}>
              {overview?.contracts?.totalActiveCount ?? 0}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      {(activeRole === Roles.Admin || activeRole === Roles.SalesManager) &&
      salesPerformanceList.length > 0 ? (
        <Card>
          <Typography.Title level={5}>Sales Performance</Typography.Title>
          {salesPerformanceList.map((item) => (
            <Typography.Paragraph key={item.userId}>
              {item.userName}: {item.dealsWon} deals,{" "}
              {item.totalRevenue?.toLocaleString?.() ?? 0}
            </Typography.Paragraph>
          ))}
        </Card>
      ) : null}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AuthGuard>
  );
}
