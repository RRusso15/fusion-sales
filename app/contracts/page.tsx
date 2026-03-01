"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { usePermission } from "@/components/hooks/usePermission";
import {
  ContractProvider,
  useContractActions,
  useContractState,
} from "@/providers/contractProvider";
import { ContractStatus, ContractStatusLabels } from "@/constants/enums";
import type { IContract } from "@/providers/contractProvider/context";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import { pdfService } from "@/services/pdfService";
import {
  ClientProvider,
  useClientActions,
  useClientState,
} from "@/providers/clientProvider";
import {
  UsersProvider,
  useUsersActions,
  useUsersState,
} from "@/providers/usersProvider";
import dayjs, { Dayjs } from "dayjs";

interface ContractsModuleProps {
  clientId?: string;
}

const ContractsContent = ({ clientId }: ContractsModuleProps) => {
  const { contracts, isPending } = useContractState();
  const { clients } = useClientState();
  const { users: tenantUsers } = useUsersState();
  const { fetchContracts, createContract, updateContract, createRenewal, completeRenewal, activateContract, cancelContract } = useContractActions();
  const { fetchClients } = useClientActions();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [exportingContractId, setExportingContractId] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [renewalForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { hasPermission, Permission } = usePermission();
  const canActivate = hasPermission(Permission.activateContract);
  const canCancel = hasPermission(Permission.cancelContract);
  const canCreate = hasPermission(Permission.createContract);

  const load = useCallback(async () => {
    const contractParams = {
      pageNumber: 1,
      pageSize: 100,
      ...(clientId ? { clientId } : {}),
    };
    await Promise.all([
      fetchContracts(contractParams),
      ...(clientId ? [] : [fetchClients({ pageNumber: 1, pageSize: 100 })]),
      fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
    ]);
  }, [clientId, fetchContracts, fetchClients, fetchUsers]);

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
    createStartDate?: Dayjs;
    createEndDate?: Dayjs;
    createOwnerId?: string;
    createAutoRenew?: boolean;
    renewalContractId?: string;
    renewalStartDate?: Dayjs;
    renewalEndDate?: Dayjs;
    renewalValue?: number;
    renewalCompleteId?: string;
  }) => {
    try {
      if ((clientId || values.createClientId) && values.createTitle && values.createValue !== undefined && values.createStartDate && values.createEndDate && canCreate) {
        await createContract({
          clientId: clientId ?? values.createClientId,
          title: values.createTitle,
          contractValue: values.createValue,
          currency: values.createCurrency,
          startDate: values.createStartDate.format("YYYY-MM-DD"),
          endDate: values.createEndDate.format("YYYY-MM-DD"),
          ownerId: values.createOwnerId,
          autoRenew: values.createAutoRenew,
        });
        createForm.resetFields();
      }
      if (values.renewalContractId && values.renewalStartDate && values.renewalEndDate && values.renewalValue !== undefined && canCreate) {
        await createRenewal(values.renewalContractId, {
          proposedStartDate: values.renewalStartDate.format("YYYY-MM-DD"),
          proposedEndDate: values.renewalEndDate.format("YYYY-MM-DD"),
          proposedValue: values.renewalValue,
        });
        renewalForm.resetFields();
      }
      if (values.renewalCompleteId && canActivate) {
        await completeRenewal(values.renewalCompleteId);
        renewalForm.resetFields(["renewalCompleteId"]);
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
      endDate: contractRecord.endDate ? dayjs(contractRecord.endDate) : undefined,
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
        endDate: values.endDate ? (values.endDate as Dayjs).format("YYYY-MM-DD") : undefined,
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

  const canExportContract = canCreate || canActivate || canCancel;

  const handleDownloadPdf = async (contractId: string) => {
    if (!canExportContract) return;
    setExportingContractId(contractId);
    try {
      await pdfService.generateContractPdf(contractId);
      message.success("Download started");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to generate contract PDF"));
    } finally {
      setExportingContractId(null);
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
          {canCreate ? (
            <Button size="small" onClick={() => openEdit(record)}>
              Edit
            </Button>
          ) : null}
          {canActivate && record.status === ContractStatus.Draft ? (
            <Button
              size="small"
              onClick={() =>
                runAction(
                  () => activateContract(record.id),
                  "Contract activated"
                )
              }
            >
              Activate
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="small"
              danger
              onClick={() =>
                runAction(() => cancelContract(record.id), "Contract cancelled")
              }
            >
              Cancel
            </Button>
          ) : null}
          {canExportContract ? (
            <Button
              size="small"
              onClick={() => handleDownloadPdf(record.id)}
              loading={exportingContractId === record.id}
              disabled={!!exportingContractId && exportingContractId !== record.id}
            >
              Download PDF
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const ownerOptions = [
    ...tenantUsers.map((entry) => ({
      value: entry.id,
      label: `${entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email} (${entry.id.slice(0, 8)})`,
    })),
  ].filter(
    (candidate, index, self) =>
      self.findIndex((item) => item.value === candidate.value) === index
  );

  return (
    <div style={capabilityStyles.container}>
      <Collapse
        items={[
          {
            key: "create-contract",
            label: "Create Contract",
            children: (
              <Form form={createForm} layout="vertical" onFinish={onCreateRenewal}>
                {!clientId ? (
                  <Form.Item
                    name="createClientId"
                    label="Client ID"
                    rules={[{ required: true, message: "Select a client" }]}
                  >
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
                ) : null}
                <Form.Item
                  name="createTitle"
                  label="Title"
                  rules={[{ required: true, message: "Enter contract title" }]}
                >
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item
                  name="createValue"
                  label="Contract Value"
                  rules={[{ required: true, message: "Enter contract value" }]}
                >
                  <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
                </Form.Item>
                <Form.Item
                  name="createCurrency"
                  label="Currency"
                  rules={[{ required: true, message: "Enter currency" }]}
                >
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item
                  name="createStartDate"
                  label="Start Date"
                  rules={[{ required: true, message: "Select start date" }]}
                >
                  <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name="createEndDate"
                  label="End Date"
                  rules={[{ required: true, message: "Select end date" }]}
                >
                  <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
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
                {canCreate ? (
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Create Contract
                  </Button>
                ) : null}
              </Form>
            ),
          },
          {
            key: "renewal-contract",
            label: "Renewal Actions",
            children: (
              <Form form={renewalForm} layout="vertical" onFinish={onCreateRenewal}>
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
                  <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="renewalEndDate" label="Renewal: End Date (YYYY-MM-DD)">
                  <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="renewalValue" label="Renewal: Proposed Value">
                  <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="renewalCompleteId" label="Renewal Complete: Renewal ID">
                  <Input disabled={!canActivate} />
                </Form.Item>
                {canCreate || canActivate ? (
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Run Renewal Action
                  </Button>
                ) : null}
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
        okButtonProps={{ style: { display: canCreate ? "inline-flex" : "none" } }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Title">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="contractValue" label="Contract Value">
            <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date (YYYY-MM-DD)">
            <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export function ContractsModule({ clientId }: ContractsModuleProps) {
  return (
    <AuthGuard>
      <UsersProvider>
        <ClientProvider>
          <ContractProvider>
            <ContractsContent clientId={clientId} />
          </ContractProvider>
        </ClientProvider>
      </UsersProvider>
    </AuthGuard>
  );
}

export default function ContractsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/clients");
  }, [router]);
  return null;
}

