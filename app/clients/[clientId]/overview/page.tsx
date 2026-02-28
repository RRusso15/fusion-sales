"use client";

import { useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, Col, Row, Statistic } from "antd";
import { capabilityStyles } from "@/app/capability.styles";
import { useClientActions, useClientState } from "@/providers/clientProvider";

export default function ClientOverviewPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const { stats } = useClientState();
  const { fetchClientStats } = useClientActions();
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    await fetchClientStats(clientId);
  }, [clientId, fetchClientStats]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  return (
    <div style={capabilityStyles.container}>
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
