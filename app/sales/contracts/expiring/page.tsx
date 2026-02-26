"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, InputNumber, Space, Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import {
  ContractProvider,
  useContractActions,
  useContractState,
} from "@/providers/contractProvider";
import { ContractStatus, ContractStatusLabels } from "@/constants/enums";
import { IContract } from "@/providers/contractProvider/context";
import { expiringStyles } from "./expiring.styles";

const ExpiringContractsContent = () => {
  const [days, setDays] = useState<number>(90);
  const { contracts, isPending } = useContractState();
  const { fetchExpiringContracts } = useContractActions();

  useEffect(() => {
    fetchExpiringContracts(days).catch(() => undefined);
  }, [days, fetchExpiringContracts]);

  const columns: TableProps<IContract>["columns"] = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      { title: "Client ID", dataIndex: "clientId", key: "clientId" },
      {
        title: "Value",
        dataIndex: "contractValue",
        key: "contractValue",
        render: (value: number, record) =>
          `${record.currency ?? "USD"} ${value?.toLocaleString?.() ?? value}`,
      },
      {
        title: "End Date",
        dataIndex: "endDate",
        key: "endDate",
        render: (value: string) => new Date(value).toLocaleDateString(),
      },
      {
        title: "Days Left",
        dataIndex: "daysUntilExpiry",
        key: "daysUntilExpiry",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value?: number) => (
          <Tag color={value === ContractStatus.Active ? "green" : "default"}>
            {value ? ContractStatusLabels[value as keyof typeof ContractStatusLabels] : "-"}
          </Tag>
        ),
      },
    ],
    []
  );

  return (
    <div style={expiringStyles.container}>
      <Space style={expiringStyles.controls}>
        <Typography.Text>Days Until Expiry</Typography.Text>
        <InputNumber
          min={1}
          max={365}
          value={days}
          onChange={(value) => setDays(value ?? 90)}
        />
        <Button onClick={() => fetchExpiringContracts(days)}>
          Refresh
        </Button>
      </Space>
      <Table<IContract>
        rowKey="id"
        loading={isPending}
        columns={columns}
        dataSource={contracts}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default function ExpiringContractsPage() {
  return (
    <ContractProvider>
      <ExpiringContractsContent />
    </ContractProvider>
  );
}
