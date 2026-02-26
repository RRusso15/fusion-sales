"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
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
import { normalizeRole } from "@/constants/roles";
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
  useContractActions,
  useContractState,
} from "@/providers/contractProvider";
import { OpportunityStageLabels, PricingRequestStatusLabels } from "@/constants/enums";
import type { IOpportunity } from "@/providers/opportunityProvider/context";
import type { IPricingRequest } from "@/providers/pricingProvider/context";
import type { IContract } from "@/providers/contractProvider/context";
import { adminStyles } from "./admin.styles";

const AdminWorkspace = () => {
  const { currentUser, user, role, tenantId } = useAuthState();
  const { logout } = useAuthActions();
  const { overview, salesPerformance, contractsExpiring, isPending: dashboardPending } =
    useDashboardState();
  const { opportunities, isPending: oppPending } = useOpportunityState();
  const { pricingRequests, isPending: pricingPending } = usePricingState();
  const { contracts, isPending: contractPending } = useContractState();
  const dashboardActions = useDashboardActions();
  const opportunityActions = useOpportunityActions();
  const pricingActions = usePricingActions();
  const contractActions = useContractActions();
  const hasLoadedRef = useRef(false);

  const activeRole = role ?? normalizeRole(user?.roles?.[0]) ?? "Unknown";

  const loadAdminData = useCallback(async () => {
    try {
      await Promise.all([
        dashboardActions.fetchOverview(),
        dashboardActions.fetchPipelineMetrics(),
        dashboardActions.fetchSalesPerformance(5),
        dashboardActions.fetchActivitiesSummary(),
        dashboardActions.fetchContractsExpiring(30),
        opportunityActions.fetchOpportunities({ pageNumber: 1, pageSize: 8 }),
        pricingActions.fetchPendingRequests(),
        contractActions.fetchExpiringContracts(90),
      ]);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        message.error("You do not have permission for one or more admin datasets.");
        return;
      }
      if (status === 404) {
        message.warning("Some resources were not found in your tenant scope.");
        return;
      }
      message.error("Failed to load admin workspace data.");
    }
  }, [contractActions, dashboardActions, opportunityActions, pricingActions]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadAdminData();
  }, [loadAdminData]);

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
        title: "Owner",
        dataIndex: "ownerId",
        key: "ownerId",
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
            {(PricingRequestStatusLabels as Record<number, string>)[value ?? 0] ?? "-"}
          </Tag>
        ),
      },
      { title: "Assigned To", dataIndex: "assignedToId", key: "assignedToId" },
    ],
    []
  );

  const contractColumns: TableProps<IContract>["columns"] = useMemo(
    () => [
      { title: "Contract", dataIndex: "title", key: "title" },
      {
        title: "Ends",
        dataIndex: "endDate",
        key: "endDate",
        render: (value: string) => new Date(value).toLocaleDateString(),
      },
      { title: "Days Left", dataIndex: "daysUntilExpiry", key: "daysUntilExpiry" },
    ],
    []
  );

  return (
    <div style={adminStyles.container}>
      <Card style={adminStyles.hero}>
        <Typography.Title level={3}>Admin Control Center</Typography.Title>
        <Typography.Text>
          Welcome {currentUser?.firstName ?? "Admin"}.
        </Typography.Text>
        <div style={adminStyles.tags}>
          <Tag>{activeRole}</Tag>
          <Tag>{tenantId ?? currentUser?.tenantId ?? "No Tenant"}</Tag>
        </div>
        <div style={adminStyles.actions}>
          <Button onClick={loadAdminData}>Refresh</Button>
          <Link href="/sales/contracts/expiring">
            <Button>Expiring Contracts Screen</Button>
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
            <Typography.Text type="secondary">Win Rate</Typography.Text>
            <Typography.Title level={4}>
              {overview?.opportunities?.winRate ?? 0}%
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
        <Col xs={24} md={6}>
          <Card>
            <Typography.Text type="secondary">Expiring (30 days)</Typography.Text>
            <Typography.Title level={4}>
              {contractsExpiring?.length ?? 0}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card title="Team Performance (Top 5)" style={adminStyles.section}>
        <Table
          rowKey="userId"
          loading={dashboardPending}
          dataSource={salesPerformance ?? []}
          pagination={false}
          columns={[
            { title: "User", dataIndex: "userName", key: "userName" },
            { title: "Deals Won", dataIndex: "dealsWon", key: "dealsWon" },
            {
              title: "Revenue",
              dataIndex: "totalRevenue",
              key: "totalRevenue",
              render: (value: number) => value?.toLocaleString?.() ?? 0,
            },
          ]}
        />
      </Card>

      <Card title="Pipeline Opportunities" style={adminStyles.section}>
        <Table<IOpportunity>
          rowKey="id"
          loading={oppPending}
          dataSource={opportunities}
          columns={opportunityColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Card title="Pending Pricing Requests" style={adminStyles.section}>
        <Table<IPricingRequest>
          rowKey="id"
          loading={pricingPending}
          dataSource={pricingRequests}
          columns={pricingColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Card title="Contracts Expiring (90 days)" style={adminStyles.section}>
        <Table<IContract>
          rowKey="id"
          loading={contractPending}
          dataSource={contracts}
          columns={contractColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default function AdminPage() {
  return (
    <DashboardProvider>
      <OpportunityProvider>
        <PricingProvider>
          <ContractProvider>
            <AdminWorkspace />
          </ContractProvider>
        </PricingProvider>
      </OpportunityProvider>
    </DashboardProvider>
  );
}
