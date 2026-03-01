"use client";

import { useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { App, Button, Card, Col, Row, Space, Statistic } from "antd";
import { capabilityStyles } from "@/app/capability.styles";
import { useClientActions, useClientState } from "@/providers/clientProvider";
import { pdfService } from "@/services/pdfService";
import { getErrorMessage } from "@/utils/requestError";
import { useState } from "react";

export default function ClientOverviewPage() {
  const { message: appMessage } = App.useApp();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const { stats } = useClientState();
  const { fetchClientStats } = useClientActions();
  const loadedRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async () => {
    await fetchClientStats(clientId);
  }, [clientId, fetchClientStats]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const handleDownloadSummary = async () => {
    setIsExporting(true);
    try {
      await pdfService.generateClientSummaryPdf(clientId);
      appMessage.success("Download started");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to generate client summary PDF"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={capabilityStyles.container}>
      <Card>
        <Space>
          <Button type="primary" onClick={handleDownloadSummary} loading={isExporting}>
            Download Summary
          </Button>
        </Space>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Opportunities" value={stats?.opportunityCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Contracts" value={stats?.contractCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Contract Value"
              value={stats?.totalContractValue ?? 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
