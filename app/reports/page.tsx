"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App, Button, Card, Space, Table } from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { Roles } from "@/constants/roles";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import { pdfService } from "@/services/pdfService";

interface ReportOpportunity {
  id: string;
  title?: string;
  ownerName?: string;
  stage?: number;
  estimatedValue?: number;
}

interface SalesByPeriod {
  period: string;
  totalRevenue: number;
}

const ReportsContent = () => {
  const { message: appMessage } = App.useApp();
  const axios = getAxiosInstance();
  const [opportunities, setOpportunities] = useState<ReportOpportunity[]>([]);
  const [salesByPeriod, setSalesByPeriod] = useState<SalesByPeriod[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setIsPending(true);
    try {
      const [oppResponse, salesResponse] = await Promise.all([
        axios.get("/api/Reports/opportunities"),
        axios.get("/api/Reports/sales-by-period", {
          params: { groupBy: "month" },
        }),
      ]);
      setOpportunities(oppResponse.data.items ?? oppResponse.data);
      setSalesByPeriod(salesResponse.data.items ?? salesResponse.data);
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to load reports"));
    } finally {
      setIsPending(false);
    }
  }, [axios]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const opportunityColumns: TableProps<ReportOpportunity>["columns"] = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Owner", dataIndex: "ownerName", key: "ownerName" },
    { title: "Stage", dataIndex: "stage", key: "stage" },
    { title: "Value", dataIndex: "estimatedValue", key: "estimatedValue" },
  ];

  const salesColumns: TableProps<SalesByPeriod>["columns"] = [
    { title: "Period", dataIndex: "period", key: "period" },
    { title: "Revenue", dataIndex: "totalRevenue", key: "totalRevenue" },
  ];

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await pdfService.generateReportPdf({ groupBy: "month" });
      appMessage.success("Download started");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to generate reports PDF"));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div style={capabilityStyles.container}>
      <Card>
        <Space>
          <Button type="primary" onClick={handleExportPdf} loading={isExportingPdf}>
            Export as PDF
          </Button>
        </Space>
      </Card>
      <Card title="Opportunities Report">
        <Table<ReportOpportunity>
          rowKey="id"
          loading={isPending}
          dataSource={opportunities}
          columns={opportunityColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Card title="Sales by Period">
        <Table<SalesByPeriod>
          rowKey="period"
          loading={isPending}
          dataSource={salesByPeriod}
          columns={salesColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default function ReportsPage() {
  return (
    <AuthGuard requiredRoles={[Roles.Admin, Roles.SalesManager]} redirectTo="/unauthorized">
      <ReportsContent />
    </AuthGuard>
  );
}
