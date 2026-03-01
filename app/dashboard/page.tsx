"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  FileProtectOutlined,
  FundOutlined,
  LogoutOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Card, Col, Row, Space, Typography } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { resolveUserRole, Roles } from "@/constants/roles";
import {
  DashboardProvider,
  useDashboardActions,
  useDashboardState,
} from "@/providers/dashboardProvider";
import { OpportunityStageLabels } from "@/constants/enums";
import { capabilityStyles } from "../capability.styles";
import { workflowService } from "@/utils/workflowService";
import type { IContract } from "@/providers/contractProvider/context";
import { PageTransition } from "@/components/ui/PageTransition";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";

type ChartDatum = {
  label: string;
  value: number;
};

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toLabel = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") {
    const mapped =
      (OpportunityStageLabels as Record<number, string>)[value] ??
      String(value);
    return mapped;
  }
  return fallback;
};

const parseChartList = (
  input: unknown,
  labelKeys: string[],
  valueKeys: string[]
): ChartDatum[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => {
      if (typeof item === "number") {
        return { label: `Item ${index + 1}`, value: asNumber(item) };
      }
      if (typeof item !== "object" || item === null) return null;
      const record = item as Record<string, unknown>;
      const labelValue =
        labelKeys.map((key) => record[key]).find(Boolean) ?? `Item ${index + 1}`;
      const valueValue =
        valueKeys.map((key) => record[key]).find((v) => v !== undefined) ?? 0;
      return {
        label: toLabel(labelValue, `Item ${index + 1}`),
        value: asNumber(valueValue),
      };
    })
    .filter((item): item is ChartDatum => !!item);
};

const BarChartCard = ({
  title,
  data,
  color,
  formatter,
}: {
  title: string;
  data: ChartDatum[];
  color: string;
  formatter?: (value: number) => string;
}) => {
  const max = Math.max(...data.map((item) => item.value), 0);
  return (
    <Card title={title}>
      {data.length === 0 ? (
        <Typography.Text type="secondary">No data available.</Typography.Text>
      ) : (
        <Space orientation="vertical" style={{ width: "100%" }} size={10}>
          {data.slice(0, 8).map((item) => (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Typography.Text>{item.label}</Typography.Text>
                <Typography.Text strong>
                  {formatter ? formatter(item.value) : item.value.toLocaleString()}
                </Typography.Text>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  background: "#edf2f4",
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    width:
                      max > 0
                        ? `${Math.max((item.value / max) * 100, 4)}%`
                        : "0%",
                    height: "100%",
                    background: color,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
};

const LineChartCard = ({
  title,
  data,
}: {
  title: string;
  data: ChartDatum[];
}) => {
  const width = 360;
  const height = 130;
  const pad = 16;
  const max = Math.max(...data.map((d) => d.value), 0);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1);
      const y = height - pad - ((d.value - min) * (height - pad * 2)) / range;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card title={title}>
      {data.length < 2 ? (
        <Typography.Text type="secondary">Not enough trend data.</Typography.Text>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
            <polyline
              fill="none"
              stroke="#2f84c5"
              strokeWidth="3"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <Typography.Text type="secondary">{data[0]?.label}</Typography.Text>
            <Typography.Text type="secondary">{data[data.length - 1]?.label}</Typography.Text>
          </div>
        </>
      )}
    </Card>
  );
};

const DashboardContent = () => {
  const { message: appMessage } = App.useApp();
  const { role, user } = useAuthState();
  const { logout } = useAuthActions();
  const {
    isPending,
    overview,
    salesPerformance,
    pipelineMetrics,
    activitiesSummary,
    contractsExpiring,
  } = useDashboardState();
  const {
    fetchOverview,
    fetchPipelineMetrics,
    fetchActivitiesSummary,
    fetchContractsExpiring,
    fetchSalesPerformance,
  } = useDashboardActions();
  const loadedRef = useRef(false);
  const activeRole = resolveUserRole(role, user?.roles);
  const [expiringContractsForRenewal, setExpiringContractsForRenewal] = useState<
    IContract[]
  >([]);
  const [renewingContractIds, setRenewingContractIds] = useState<string[]>([]);
  const salesPerformanceList = Array.isArray(salesPerformance)
    ? salesPerformance
    : [];

  const load = useCallback(async () => {
    const jobs: Promise<void>[] = [
      fetchOverview(),
      fetchPipelineMetrics(),
      fetchActivitiesSummary(),
      fetchContractsExpiring(30),
    ];
    if (activeRole === Roles.Admin || activeRole === Roles.SalesManager) {
      jobs.push(fetchSalesPerformance(5));
    }
    await Promise.all(jobs);

    try {
      const expiringContracts = await workflowService.handleContractExpiring({
        daysUntilExpiry: 90,
      });
      setExpiringContractsForRenewal(expiringContracts);
    } catch (workflowError) {
      console.error("Contract expiring workflow load failed", workflowError);
      appMessage.warning("Primary action succeeded. Follow-up automation failed.");
    }
  }, [
    activeRole,
    fetchActivitiesSummary,
    fetchContractsExpiring,
    fetchOverview,
    fetchPipelineMetrics,
    fetchSalesPerformance,
    setExpiringContractsForRenewal,
  ]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const pipelineStageData = parseChartList(
    (pipelineMetrics as { stages?: unknown[] } | undefined)?.stages ??
      (overview as { pipeline?: { stages?: unknown[] } } | undefined)?.pipeline?.stages,
    ["stageLabel", "name", "label", "stage"],
    ["totalValue", "value", "amount", "weightedValue", "opportunityCount"]
  );

  const activitiesByStatus = parseChartList(
    (activitiesSummary as { groupedByStatus?: unknown[] } | undefined)?.groupedByStatus,
    ["statusLabel", "name", "label", "status"],
    ["count", "total", "value"]
  );

  const activitiesByType = parseChartList(
    (activitiesSummary as { groupedByType?: unknown[] } | undefined)?.groupedByType,
    ["typeLabel", "name", "label", "type"],
    ["count", "total", "value"]
  );

  const revenueTrend = parseChartList(
    (overview as { revenue?: { monthlyTrend?: unknown[] } } | undefined)?.revenue?.monthlyTrend,
    ["label", "month", "period"],
    ["value", "amount", "revenue", "total"]
  );

  const expiringContractsData = parseChartList(
    Array.isArray(contractsExpiring) ? contractsExpiring : [],
    ["title", "name"],
    ["daysUntilExpiry"]
  ).map((item) => ({
    ...item,
    value: Math.max(0, 30 - item.value),
  }));

  const salesPerformanceData = salesPerformanceList.map((item) => ({
    label: item.userName,
    value: asNumber(item.totalRevenue),
  }));

  const handleCreateRenewalOpportunity = async (contractId: string) => {
    setRenewingContractIds((previous) => [...previous, contractId]);
    try {
      await workflowService.createRenewalOpportunity(contractId);
      appMessage.success("Renewal opportunity created.");
      const refreshed = await workflowService.handleContractExpiring({
        daysUntilExpiry: 90,
      });
      setExpiringContractsForRenewal(refreshed);
    } catch (error) {
      console.error("Renewal workflow failed", error);
      appMessage.warning("Primary action succeeded. Follow-up automation failed.");
    } finally {
      setRenewingContractIds((previous) =>
        previous.filter((id) => id !== contractId)
      );
    }
  };

  return (
    <PageTransition>
      {isPending ? (
        <ContentSkeleton variant="cards" />
      ) : (
    <div style={capabilityStyles.container} className="fade-in">
      <Card style={capabilityStyles.header}>
        <div style={capabilityStyles.actions}>
          <Button danger icon={<LogoutOutlined />} onClick={logout} className="press">
            Logout
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={capabilityStyles.cardsRow}>
        <Col xs={24} md={6}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<FundOutlined />}
                style={{ background: "#e8f4fb", color: "#1f78b4" }}
              />
              <div>
                <Typography.Text type="secondary">Pipeline Value</Typography.Text>
                <Typography.Title level={4}>
                  {overview?.opportunities?.pipelineValue?.toLocaleString?.() ?? 0}
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<RiseOutlined />}
                style={{ background: "#ebf8ef", color: "#2c9d4d" }}
              />
              <div>
                <Typography.Text type="secondary">Open Opportunities</Typography.Text>
                <Typography.Title level={4}>
                  {overview?.opportunities?.totalCount ?? 0}
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<CalendarOutlined />}
                style={{ background: "#fff5e8", color: "#dd7b2c" }}
              />
              <div>
                <Typography.Text type="secondary">Upcoming Activities</Typography.Text>
                <Typography.Title level={4}>
                  {overview?.activities?.upcomingCount ?? 0}
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<FileProtectOutlined />}
                style={{ background: "#eef2f8", color: "#4e6fa8" }}
              />
              <div>
                <Typography.Text type="secondary">Active Contracts</Typography.Text>
                <Typography.Title level={4}>
                  {overview?.contracts?.totalActiveCount ?? 0}
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<CheckCircleOutlined />}
                style={{ background: "#eaf8f0", color: "#30995b" }}
              />
              <div>
                <Typography.Text type="secondary">Win Rate</Typography.Text>
                <Typography.Title level={4}>
                  {asNumber(overview?.opportunities?.winRate).toFixed(2)}%
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<DollarCircleOutlined />}
                style={{ background: "#edf6ff", color: "#2e7dc2" }}
              />
              <div>
                <Typography.Text type="secondary">Revenue (This Month)</Typography.Text>
                <Typography.Title level={4}>
                  {overview?.revenue?.thisMonth?.toLocaleString?.() ?? 0}
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="hover-lift scale-in">
            <Space align="start">
              <Avatar
                icon={<CalendarOutlined />}
                style={{ background: "#fff6e9", color: "#cb7f17" }}
              />
              <div>
                <Typography.Text type="secondary">Expiring This Month</Typography.Text>
                <Typography.Title level={4}>
                  {overview?.contracts?.expiringThisMonthCount ?? 0}
                </Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChartCard
            title="Pipeline by Stage"
            data={pipelineStageData}
            color="#3a8ecb"
            formatter={(value) => value.toLocaleString()}
          />
        </Col>
        <Col xs={24} lg={12}>
          <LineChartCard title="Monthly Revenue Trend" data={revenueTrend} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChartCard
            title="Activities by Status"
            data={activitiesByStatus}
            color="#27a078"
          />
        </Col>
        <Col xs={24} lg={12}>
          <BarChartCard
            title="Activities by Type"
            data={activitiesByType}
            color="#cc7b2e"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChartCard
            title="Contracts Expiring Soon (Urgency)"
            data={expiringContractsData}
            color="#c84f4f"
          />
        </Col>
        {(activeRole === Roles.Admin || activeRole === Roles.SalesManager) && (
          <Col xs={24} lg={12}>
            <BarChartCard
              title="Sales Performance (Revenue)"
              data={salesPerformanceData}
              color="#4f72d3"
              formatter={(value) => value.toLocaleString()}
            />
          </Col>
        )}
      </Row>

      {(activeRole === Roles.Admin || activeRole === Roles.SalesManager) &&
      salesPerformanceList.length > 0 ? (
        <Card>
          <Typography.Title level={5}>Top Sales Team Snapshot</Typography.Title>
          {salesPerformanceList.map((item) => (
            <Typography.Paragraph key={item.userId}>
              {item.userName}: {item.dealsWon} deals,{" "}
              {item.totalRevenue?.toLocaleString?.() ?? 0}
            </Typography.Paragraph>
          ))}
        </Card>
      ) : null}

      <Card title="Contract Renewals (Expiring in 90 Days)">
        {expiringContractsForRenewal.length === 0 ? (
          <Typography.Text type="secondary">
            No contracts currently require renewal workflow.
          </Typography.Text>
        ) : (
          <Space orientation="vertical" style={{ width: "100%" }} size={10}>
            {expiringContractsForRenewal.map((contract) => (
              <div
                key={contract.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Typography.Text>
                  {contract.title ?? contract.id}{" "}
                  <span className={contract.daysUntilExpiry && contract.daysUntilExpiry <= 30 ? "expiring-pulse" : ""}>
                    ({contract.daysUntilExpiry ?? "-"} days left)
                  </span>
                </Typography.Text>
                <Button
                  className="press"
                  onClick={() => handleCreateRenewalOpportunity(contract.id)}
                  loading={renewingContractIds.includes(contract.id)}
                >
                  Create Renewal Opportunity
                </Button>
              </div>
            ))}
          </Space>
        )}
      </Card>
    </div>
      )}
    </PageTransition>
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
