"use client";

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { normalizeRole, Roles } from "@/constants/roles";
import {
  ActivityProvider,
  useActivityActions,
  useActivityState,
} from "@/providers/activityProvider";
import {
  DashboardProvider,
  useDashboardActions,
  useDashboardState,
} from "@/providers/dashboardProvider";
import {
  OpportunityProvider,
  useOpportunityActions,
  useOpportunityState,
} from "@/providers/opportunityProvider";
import {
  PricingProvider,
  usePricingActions,
  usePricingState,
} from "@/providers/pricingProvider";
import {
  ContractProvider,
  useContractState,
} from "@/providers/contractProvider";
import type { IOpportunity } from "@/providers/opportunityProvider/context";
import type { IActivity } from "@/providers/activityProvider/context";
import type { IPricingRequest } from "@/providers/pricingProvider/context";
import {
  ActivityStatusLabels,
  OpportunityStageLabels,
  PricingRequestStatusLabels,
  PriorityLabels,
} from "@/constants/enums";
import { salesStyles } from "./sales.styles";

const SalesWorkspace = () => {
  const { currentUser, user, role, tenantId } = useAuthState();
  const { logout } = useAuthActions();
  const { overview, contractsExpiring, isPending: dashboardPending } =
    useDashboardState();
  const { opportunities, isPending: opportunityPending } = useOpportunityState();
  const { activities, isPending: activityPending } = useActivityState();
  const { pricingRequests, isPending: pricingPending } = usePricingState();
  const { contracts } = useContractState();

  const dashboardActions = useDashboardActions();
  const opportunityActions = useOpportunityActions();
  const activityActions = useActivityActions();
  const pricingActions = usePricingActions();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canSeeTeamScope =
    activeRole === Roles.Admin ||
    activeRole === Roles.SalesManager ||
    activeRole === Roles.BusinessDevelopmentManager;

  const handleRequestError = useCallback((error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response?.status;

    if (status === 404) {
      message.warning("Requested data was not found.");
      return;
    }
    if (status === 403) {
      message.error("You are not authorized for this action.");
      return;
    }
    if (status === 400) {
      message.error("Validation error on request.");
      return;
    }
    message.error("Unable to load dashboard data.");
  }, []);

  const loadSalesData = useCallback(async () => {
    const jobs: Promise<void>[] = [
      dashboardActions.fetchOverview(),
      dashboardActions.fetchContractsExpiring(30),
      dashboardActions.fetchActivitiesSummary(),
    ];

    if (canSeeTeamScope) {
      jobs.push(
        opportunityActions.fetchOpportunities({ pageNumber: 1, pageSize: 8 }),
        dashboardActions.fetchPipelineMetrics(),
        dashboardActions.fetchSalesPerformance(5),
        activityActions.fetchActivities({ pageNumber: 1, pageSize: 8 }),
        pricingActions.fetchPendingRequests()
      );
    } else {
      jobs.push(
        opportunityActions.fetchMyOpportunities({ pageNumber: 1, pageSize: 8 }),
        activityActions.fetchMyActivities({ pageNumber: 1, pageSize: 8 }),
        pricingActions.fetchMyRequests()
      );
    }

    try {
      await Promise.all(jobs);
    } catch (error) {
      handleRequestError(error);
    }
  }, [
    activityActions,
    canSeeTeamScope,
    dashboardActions,
    handleRequestError,
    opportunityActions,
    pricingActions,
  ]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const opportunityColumns: TableProps<IOpportunity>["columns"] = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      {
        title: "Stage",
        dataIndex: "stage",
        key: "stage",
        render: (value?: number) => (
          <Tag>
            {(OpportunityStageLabels as Record<number, string>)[value ?? 0] ?? "-"}
          </Tag>
        ),
      },
      {
        title: "Value",
        dataIndex: "estimatedValue",
        key: "estimatedValue",
        render: (value?: number, record?: IOpportunity) =>
          `${record?.currency ?? "USD"} ${value?.toLocaleString?.() ?? 0}`,
      },
    ],
    []
  );

  const activityColumns: TableProps<IActivity>["columns"] = useMemo(
    () => [
      { title: "Subject", dataIndex: "subject", key: "subject" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value?: number) => (
          <Tag>
            {(ActivityStatusLabels as Record<number, string>)[value ?? 0] ?? "-"}
          </Tag>
        ),
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (value?: number) => (
          <Tag>
            {(PriorityLabels as Record<number, string>)[value ?? 0] ?? "-"}
          </Tag>
        ),
      },
      {
        title: "Due",
        dataIndex: "dueDate",
        key: "dueDate",
        render: (value?: string) =>
          value ? new Date(value).toLocaleDateString() : "-",
      },
    ],
    []
  );

  const pricingColumns: TableProps<IPricingRequest>["columns"] = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value?: number) => (
          <Tag>
            {(PricingRequestStatusLabels as Record<number, string>)[value ?? 0] ??
              "-"}
          </Tag>
        ),
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (value?: number) => (
          <Tag>
            {(PriorityLabels as Record<number, string>)[value ?? 0] ?? "-"}
          </Tag>
        ),
      },
      {
        title: "Required By",
        dataIndex: "requiredByDate",
        key: "requiredByDate",
        render: (value?: string) =>
          value ? new Date(value).toLocaleDateString() : "-",
      },
    ],
    []
  );

  return (
    <div style={salesStyles.container}>
      <Card style={salesStyles.hero}>
        <Typography.Title level={3}>Sales Workspace</Typography.Title>
        <Typography.Text>
          Welcome {currentUser?.firstName ?? "User"}
        </Typography.Text>
        <div style={salesStyles.metaRow}>
          <Tag>{activeRole ?? "Unknown Role"}</Tag>
          <Tag>{tenantId ?? currentUser?.tenantId ?? "No Tenant"}</Tag>
        </div>
        <div style={salesStyles.actions}>
          <Button onClick={loadSalesData}>Refresh</Button>
          <Link href="/sales/contracts/expiring">
            <Button type="default">View Expiring Contracts</Button>
          </Link>
          <Button danger onClick={logout}>
            Logout
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
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
            <Typography.Text type="secondary">Expiring Contracts</Typography.Text>
            <Typography.Title level={4}>
              {contractsExpiring?.length ?? contracts.length ?? 0}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      {!activeRole ? (
        <Alert
          type="warning"
          message="Role claim missing from token. Your view may be limited."
          showIcon
        />
      ) : null}

      <Card title={canSeeTeamScope ? "Team Opportunities" : "My Opportunities"} style={salesStyles.section}>
        <Table<IOpportunity>
          rowKey="id"
          columns={opportunityColumns}
          dataSource={opportunities}
          loading={opportunityPending || dashboardPending}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Card title={canSeeTeamScope ? "Team Activities" : "My Activities"} style={salesStyles.section}>
        <Table<IActivity>
          rowKey="id"
          columns={activityColumns}
          dataSource={activities}
          loading={activityPending}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Card
        title={canSeeTeamScope ? "Pending Pricing Requests" : "My Pricing Requests"}
        style={salesStyles.section}
      >
        <Table<IPricingRequest>
          rowKey="id"
          columns={pricingColumns}
          dataSource={pricingRequests}
          loading={pricingPending}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default function SalesPage() {
  return (
    <DashboardProvider>
      <OpportunityProvider>
        <ActivityProvider>
          <PricingProvider>
            <ContractProvider>
              <SalesWorkspace />
            </ContractProvider>
          </PricingProvider>
        </ActivityProvider>
      </OpportunityProvider>
    </DashboardProvider>
  );
}
