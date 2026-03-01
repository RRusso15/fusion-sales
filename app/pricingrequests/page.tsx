"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  App,
  Alert,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { usePermission } from "@/components/hooks/usePermission";
import {
  PricingProvider,
  usePricingActions,
  usePricingState,
} from "@/providers/pricingProvider";
import type { IPricingRequest } from "@/providers/pricingProvider/context";
import type { PriorityValue } from "@/constants/enums";
import { PriorityLabels, PricingRequestStatusLabels } from "@/constants/enums";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import {
  ClientProvider,
  useClientActions,
  useClientState,
} from "@/providers/clientProvider";
import {
  OpportunityProvider,
  useOpportunityActions,
  useOpportunityState,
} from "@/providers/opportunityProvider";
import {
  UsersProvider,
  useUsersActions,
  useUsersState,
} from "@/providers/usersProvider";
import {
  PricingProposalPrefill,
  workflowService,
} from "@/utils/workflowService";

const PricingRequestsContent = () => {
  const { message: appMessage } = App.useApp();
  const params = useParams<{ clientId?: string }>();
  const clientId = typeof params?.clientId === "string" ? params.clientId : undefined;
  const { pricingRequests, isPending } = usePricingState();
  const { clients } = useClientState();
  const { opportunities } = useOpportunityState();
  const { users: tenantUsers } = useUsersState();
  const {
    fetchPricingRequests,
    createPricingRequest,
    updatePricingRequest,
    assignPricingRequest,
    completePricingRequest,
  } = usePricingActions();
  const { fetchClients } = useClientActions();
  const { fetchOpportunities } = useOpportunityActions();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [pricingProposalPrefill, setPricingProposalPrefill] =
    useState<PricingProposalPrefill | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [proposalForm] = Form.useForm();

  const { hasPermission, Permission } = usePermission();
  const canAssign = hasPermission(Permission.assignPricingRequest);
  const canComplete = hasPermission(Permission.createPricingRequest);
  const canCreate = hasPermission(Permission.createPricingRequest);

  const load = useCallback(async () => {
    const pricingParams = {
      pageNumber: 1,
      pageSize: 100,
      ...(clientId ? { clientId } : {}),
    };
    const opportunitiesParams = {
      pageNumber: 1,
      pageSize: 100,
      ...(clientId ? { clientId } : {}),
    };

    await Promise.all([
      fetchPricingRequests(pricingParams),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      fetchOpportunities(opportunitiesParams),
      fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
    ]);
  }, [
    clientId,
    fetchPricingRequests,
    fetchClients,
    fetchOpportunities,
    fetchUsers,
  ]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const onAssign = async (id: string, userId: string) => {
    try {
      await assignPricingRequest(id, userId);
      await load();
      appMessage.success("Pricing request assigned");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to assign pricing request"));
    }
  };

  const onComplete = async (id: string) => {
    try {
      await completePricingRequest(id);
      try {
        const prefill = await workflowService.handlePricingCompleted({
          pricingRequestId: id,
        });
        setPricingProposalPrefill(prefill);
      } catch (workflowError) {
        console.error("Pricing complete workflow failed", workflowError);
        appMessage.warning("Primary action succeeded. Follow-up automation failed.");
      }
      await load();
      appMessage.success("Pricing request completed");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to complete pricing request"));
    }
  };

  const handleOpenProposalModal = () => {
    if (!pricingProposalPrefill) return;
    proposalForm.setFieldsValue({
      title: pricingProposalPrefill.proposalTitle,
      description: pricingProposalPrefill.proposalDescription,
      opportunityId: pricingProposalPrefill.opportunityId,
      clientId: pricingProposalPrefill.clientId,
      currency: pricingProposalPrefill.currency,
    });
    setIsProposalModalOpen(true);
  };

  const handleGenerateProposal = async () => {
    if (!pricingProposalPrefill) return;
    try {
      const values = await proposalForm.validateFields();
      await workflowService.createProposalFromPricing({
        ...pricingProposalPrefill,
        proposalTitle: values.title,
        proposalDescription: values.description,
        opportunityId: values.opportunityId,
        clientId: values.clientId,
        currency: values.currency,
      });
      setIsProposalModalOpen(false);
      setPricingProposalPrefill(null);
      await load();
      appMessage.success("Proposal generated from pricing request");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      appMessage.error(getErrorMessage(error, "Unable to generate proposal"));
    }
  };

  const onCreate = async (values: {
    createTitle?: string;
    createDescription?: string;
    createClientId?: string;
    createOpportunityId?: string;
    createRequestedById?: string;
    createPriority?: number;
  }) => {
    try {
      if (values.createTitle && (clientId || values.createClientId) && values.createRequestedById && canCreate) {
        await createPricingRequest({
          title: values.createTitle,
          description: values.createDescription,
          clientId: clientId ?? values.createClientId,
          opportunityId: values.createOpportunityId,
          requestedById: values.createRequestedById,
          priority: values.createPriority as PriorityValue | undefined,
        });
        createForm.resetFields();
      }
      await load();
      appMessage.success("Pricing request created");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to create pricing request"));
    }
  };

  const openEdit = (request: IPricingRequest) => {
    if (!canCreate) return;
    setEditingPricingId(request.id);
    editForm.setFieldsValue({
      title: request.title,
      description: request.description,
      priority: request.priority,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingPricingId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updatePricingRequest(editingPricingId, {
        title: values.title,
        description: values.description,
        priority: values.priority as PriorityValue | undefined,
      });
      setIsEditOpen(false);
      setEditingPricingId(null);
      await load();
      appMessage.success("Pricing request updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      appMessage.error(getErrorMessage(error, "Unable to update pricing request"));
    }
  };

  const columns: TableProps<IPricingRequest>["columns"] = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value?: number) =>
        (PricingRequestStatusLabels as Record<number, string>)[value ?? 0] ?? "-",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (value?: number) =>
        (PriorityLabels as Record<number, string>)[value ?? 0] ?? "-",
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
          {canAssign ? (
            <Select
              placeholder="Assign User"
              size="small"
              style={{ minWidth: 220 }}
              options={[
                ...tenantUsers.map((entry) => ({
                  value: entry.id,
                  label: `${entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email}`,
                })),
              ].filter(
                (candidate, index, self) =>
                  self.findIndex((item) => item.value === candidate.value) === index
              )}
              onSelect={(value) => onAssign(record.id, String(value))}
            />
          ) : null}
          {canComplete ? (
            <Button
              size="small"
              onClick={() => onComplete(record.id)}
            >
              Complete
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div style={capabilityStyles.container}>
      {pricingProposalPrefill ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Pricing request completed"
          description={
            <Space>
              <span>Generate Proposal from Pricing</span>
              <Button size="small" type="primary" onClick={handleOpenProposalModal}>
                Generate Proposal from Pricing
              </Button>
            </Space>
          }
        />
      ) : null}
      <Collapse
        items={[
          {
            key: "create-pricing",
            label: "Create Pricing Request",
            children: (
              <Form form={createForm} layout="vertical" onFinish={onCreate}>
                <Form.Item name="createTitle" label="Title">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createDescription" label="Description">
                  <Input.TextArea disabled={!canCreate} />
                </Form.Item>
                {!clientId ? (
                  <Form.Item name="createClientId" label="Client">
                    <Select
                      disabled={!canCreate}
                      options={clients.map((client) => ({
                        value: client.id,
                        label: `${client.name}`,
                      }))}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                ) : null}
                <Form.Item name="createOpportunityId" label="Opportunity">
                  <Select
                    disabled={!canCreate}
                    allowClear
                    options={opportunities.map((opportunity) => ({
                      value: opportunity.id,
                      label: `${opportunity.title}`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createRequestedById" label="Requested By User">
                  <Select
                    disabled={!canCreate}
                    options={[
                      ...tenantUsers.map((entry) => ({
                        value: entry.id,
                        label: `${entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email}`,
                      })),
                    ].filter(
                      (candidate, index, self) =>
                        self.findIndex((item) => item.value === candidate.value) === index
                    )}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createPriority" label="Priority">
                  <Select
                    disabled={!canCreate}
                    options={Object.entries(PriorityLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                  />
                </Form.Item>
                {canCreate ? (
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Create Pricing Request
                  </Button>
                ) : null}
              </Form>
            ),
          },
        ]}
      />
      <Table<IPricingRequest>
        rowKey="id"
        loading={isPending}
        dataSource={pricingRequests}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Pricing Request"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingPricingId(null);
        }}
        onOk={onEditSave}
        okButtonProps={{ style: { display: canCreate ? "inline-flex" : "none" } }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Title">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select
              disabled={!canCreate}
              options={Object.entries(PriorityLabels).map(([value, label]) => ({
                value: Number(value),
                label,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Generate Proposal from Pricing"
        open={isProposalModalOpen}
        onCancel={() => setIsProposalModalOpen(false)}
        onOk={handleGenerateProposal}
      >
        <Form form={proposalForm} layout="vertical">
          <Form.Item
            name="title"
            label="Proposal Title"
            rules={[{ required: true, message: "Enter proposal title" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="opportunityId"
            label="Opportunity"
            rules={[{ required: true, message: "Opportunity is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="clientId"
            label="Client"
            rules={[{ required: true, message: "Client is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="currency" label="Currency">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export function PricingRequestsModule() {
  return (
    <AuthGuard>
      <UsersProvider>
        <ClientProvider>
          <OpportunityProvider>
            <PricingProvider>
              <PricingRequestsContent />
            </PricingProvider>
          </OpportunityProvider>
        </ClientProvider>
      </UsersProvider>
    </AuthGuard>
  );
}

export default function PricingRequestsPage() {
  return <PricingRequestsModule />;
}



