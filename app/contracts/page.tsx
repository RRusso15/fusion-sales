"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole } from "@/constants/roles";
import { hasPermission, Permission } from "@/constants/permissions";
import {
  ContractProvider,
  useContractActions,
  useContractState,
} from "@/providers/contractProvider";
import { ContractStatus, ContractStatusLabels } from "@/constants/enums";
import type { IContract } from "@/providers/contractProvider/context";
import { capabilityStyles } from "../capability.styles";
import { CapabilityNav } from "@/components/navigation/CapabilityNav";
import { getErrorMessage } from "@/utils/requestError";
import {
  ClientProvider,
  useClientActions,
  useClientState,
} from "@/providers/clientProvider";
import {
  DashboardProvider,
  useDashboardActions,
  useDashboardState,
} from "@/providers/dashboardProvider";

const ContractsContent = () => {
  const { role, user } = useAuthState();
  const { contracts, isPending } = useContractState();
  const { clients } = useClientState();
  const { salesPerformance } = useDashboardState();
  const { fetchContracts, createContract, updateContract, createRenewal, completeRenewal, activateContract, cancelContract } = useContractActions();
  const { fetchClients } = useClientActions();
  const { fetchSalesPerformance } = useDashboardActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canActivate = hasPermission(activeRole, Permission.activateContract);
  const canCancel = hasPermission(activeRole, Permission.cancelContract);
  const canCreate = hasPermission(activeRole, Permission.createContract);

  const load = useCallback(async () => {
    await Promise.all([
      fetchContracts({ pageNumber: 1, pageSize: 20 }),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      fetchSalesPerformance(20),
    ]);
  }, [fetchContracts, fetchClients, fetchSalesPerformance]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const runAction = async (fn: () => Promise<void>, text: string) => {
    try {
      await fn();
      await load();
      message.success(text);
    } catch (error) {
      message.error(getErrorMessage(error, "Action failed"));
    }
  };

  const onCreateRenewal = async (values: {
    createClientId?: string;
    createTitle?: string;
    createValue?: number;
    createCurrency?: string;
    createStartDate?: string;
    createEndDate?: string;
    createOwnerId?: string;
    createAutoRenew?: boolean;
    renewalContractId?: string;
    renewalStartDate?: string;
    renewalEndDate?: string;
    renewalValue?: number;
    renewalCompleteId?: string;
  }) => {
    try {
      if (values.createClientId && values.createTitle && values.createValue !== undefined && values.createStartDate && values.createEndDate && canCreate) {
        await createContract({
          clientId: values.createClientId,
          title: values.createTitle,
          contractValue: values.createValue,
          currency: values.createCurrency,
          startDate: values.createStartDate,
          endDate: values.createEndDate,
          ownerId: values.createOwnerId,
          autoRenew: values.createAutoRenew,
        });
      }
      if (values.renewalContractId && values.renewalStartDate && values.renewalEndDate && values.renewalValue !== undefined && canCreate) {
        await createRenewal(values.renewalContractId, {
          proposedStartDate: values.renewalStartDate,
          proposedEndDate: values.renewalEndDate,
          proposedValue: values.renewalValue,
        });
      }
      if (values.renewalCompleteId && canActivate) {
        await completeRenewal(values.renewalCompleteId);
      }
      await load();
      message.success("Contract action completed");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to process contract action"));
    }
  };

  const openEdit = (contractRecord: IContract) => {
    if (!canCreate) return;
    setEditingContractId(contractRecord.id);
    editForm.setFieldsValue({
      title: contractRecord.title,
      contractValue: contractRecord.contractValue,
      endDate: contractRecord.endDate,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingContractId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updateContract(editingContractId, {
        title: values.title,
        contractValue: values.contractValue,
        endDate: values.endDate,
      });
      setIsEditOpen(false);
      setEditingContractId(null);
      await load();
      message.success("Contract updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update contract"));
    }
  };

  const columns: TableProps<IContract>["columns"] = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value?: number) => (
        <Tag>{(ContractStatusLabels as Record<number, string>)[value ?? 0] ?? "-"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)} disabled={!canCreate}>
            Edit
          </Button>
          <Button
            size="small"
            disabled={record.status !== ContractStatus.Draft || !canActivate}
            onClick={() =>
              runAction(
                () => activateContract(record.id),
                "Contract activated"
              )
            }
          >
            Activate
          </Button>
          <Button
            size="small"
            danger
            disabled={!canCancel}
            onClick={() =>
              runAction(() => cancelContract(record.id), "Contract cancelled")
            }
          >
            Cancel
          </Button>
        </Space>
      ),
    },
  ];

  const ownerOptions = [
    ...(user?.id
      ? [
          {
            value: user.id,
            label:
              `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
              user.email ||
              "Current User",
          },
        ]
      : []),
    ...((Array.isArray(salesPerformance) ? salesPerformance : []).map((entry) => ({
      value: entry.userId,
      label: `${entry.userName} (${entry.userId.slice(0, 8)})`,
    }))),
  ].filter(
    (candidate, index, self) =>
      self.findIndex((item) => item.value === candidate.value) === index
  );

  return (
    <div style={capabilityStyles.container}>
      <Card style={capabilityStyles.header}>
        <Typography.Title level={3}>Contracts</Typography.Title>
        <div style={capabilityStyles.actions}>
          <Button onClick={() => load()}>Refresh</Button>
          <CapabilityNav />
        </div>
      </Card>
      <Collapse
        items={[
          {
            key: "create-contract",
            label: "Create Contract",
            children: (
              <Form layout="vertical" onFinish={onCreateRenewal}>
                <Form.Item name="createClientId" label="Client ID">
                  <Select
                    disabled={!canCreate}
                    options={clients.map((client) => ({
                      value: client.id,
                      label: `${client.name} (${client.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createTitle" label="Title">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createValue" label="Contract Value">
                  <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createCurrency" label="Currency">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createStartDate" label="Start Date (YYYY-MM-DD)">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createEndDate" label="End Date (YYYY-MM-DD)">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createOwnerId" label="Owner ID">
                  <Select
                    disabled={!canCreate}
                    options={ownerOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createAutoRenew" label="Auto Renew" valuePropName="checked">
                  <Switch disabled={!canCreate} />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Contract
                </Button>
              </Form>
            ),
          },
          {
            key: "renewal-contract",
            label: "Renewal Actions",
            children: (
              <Form layout="vertical" onFinish={onCreateRenewal}>
                <Form.Item name="renewalContractId" label="Renewal: Contract ID">
                  <Select
                    disabled={!canCreate}
                    options={contracts.map((contract) => ({
                      value: contract.id,
                      label: `${contract.title} (${contract.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="renewalStartDate" label="Renewal: Start Date (YYYY-MM-DD)">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="renewalEndDate" label="Renewal: End Date (YYYY-MM-DD)">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="renewalValue" label="Renewal: Proposed Value">
                  <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="renewalCompleteId" label="Renewal Complete: Renewal ID">
                  <Input disabled={!canActivate} />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate && !canActivate}>
                  Run Renewal Action
                </Button>
              </Form>
            ),
          },
        ]}
      />
      <Table<IContract>
        rowKey="id"
        loading={isPending}
        dataSource={contracts}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Contract"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingContractId(null);
        }}
        onOk={onEditSave}
        okButtonProps={{ disabled: !canCreate }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Title">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="contractValue" label="Contract Value">
            <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date (YYYY-MM-DD)">
            <Input disabled={!canCreate} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default function ContractsPage() {
  return (
    <AuthGuard>
      <DashboardProvider>
        <ClientProvider>
          <ContractProvider>
            <ContractsContent />
          </ContractProvider>
        </ClientProvider>
      </DashboardProvider>
    </AuthGuard>
  );
}
