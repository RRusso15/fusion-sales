"use client";

import Link from "next/link";
import { Alert, Button, Card, Space, Tag, Typography } from "antd";
import type { ExecutionResult } from "@/services/ai/executeSetupPlan";

export const ExecutionSummaryCard = ({ result }: { result: ExecutionResult }) => {
  return (
    <Card title="Execution Summary" className="step-enter">
      <Space orientation="vertical" style={{ width: "100%" }} className="stagger-list">
        <Tag color={result.success ? "green" : "orange"}>
          {result.success ? "Completed" : "Completed with issues"}
        </Tag>
        {result.steps.map((step) => (
          <Alert
            key={step.key}
            className={step.status === "success" ? "step-check" : ""}
            type={
              step.status === "success"
                ? "success"
                : step.status === "failed"
                ? "error"
                : "info"
            }
            showIcon
            title={`${step.label}: ${step.message}`}
          />
        ))}
        {result.warnings.length > 0 ? (
          <Alert type="warning" showIcon title={result.warnings.join(" | ")} />
        ) : null}
        {result.links.length > 0 ? (
          <>
            <Typography.Text strong>Deep Links</Typography.Text>
            <Space wrap>
              {result.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  <Button size="small">{link.label}</Button>
                </Link>
              ))}
            </Space>
          </>
        ) : null}
      </Space>
    </Card>
  );
};

