"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole, Roles } from "@/constants/roles";
import { hasPermission, Permission } from "@/constants/permissions";
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

const PricingRequestsContent = () => {
  const { role, user } = useAuthState();
  const { pricingRequests, isPending } = usePricingState();
  const { clients } = useClientState();
  const { opportunities } = useOpportunityState();
  const { users: tenantUsers } = useUsersState();
  const {
    fetchPendingRequests,
    fetchMyRequests,
    createPricingRequest,
    updatePricingRequest,
    assignPricingRequest,
    completePricingRequest,
  } = usePricingActions();
  const { fetchClients } = useClientActions();
  const { fetchOpportunities, fetchMyOpportunities } = useOpportunityActions();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canAssign = hasPermission(activeRole, Permission.assignPricingRequest);
  const canComplete = hasPermission(activeRole, Permission.createPricingRequest);
  const canCreate = hasPermission(activeRole, Permission.createPricingRequest);
  const viewPending = activeRole === Roles.Admin || activeRole === Roles.SalesManager;

  const load = useCallback(async () => {
    if (viewPending) {
      await Promise.all([
        fetchPendingRequests(),
        fetchClients({ pageNumber: 1, pageSize: 100 }),
        fetchOpportunities({ pageNumber: 1, pageSize: 100 }),
        fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
      ]);
      return;
    }
    await Promise.all([
      fetchMyRequests(),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      fetchMyOpportunities({ pageNumber: 1, pageSize: 100 }),
      fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
    ]);
  }, [
    fetchMyRequests,
    fetchPendingRequests,
    viewPending,
    fetchClients,
    fetchOpportunities,
    fetchMyOpportunities,
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
      message.success("Pricing request assigned");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to assign pricing request"));
    }
  };

  const onComplete = async (id: string) => {
    try {
      await completePricingRequest(id);
      await load();
      message.success("Pricing request completed");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to complete pricing request"));
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
      if (values.createTitle && values.createClientId && values.createRequestedById && canCreate) {
        await createPricingRequest({
          title: values.createTitle,
          description: values.createDescription,
          clientId: values.createClientId,
          opportunityId: values.createOpportunityId,
          requestedById: values.createRequestedById,
          priority: values.createPriority as PriorityValue | undefined,
        });
      }
      await load();
      message.success("Pricing request created");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to create pricing request"));
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
      message.success("Pricing request updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update pricing request"));
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
          <Button size="small" onClick={() => openEdit(record)} disabled={!canCreate}>
            Edit
          </Button>
          <Select
            placeholder="Assign User"
            size="small"
            disabled={!canAssign}
            style={{ minWidth: 220 }}
            options={[
              ...tenantUsers.map((entry) => ({
                value: entry.id,
                label: `${entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email} (${entry.id.slice(0, 8)})`,
              })),
            ].filter(
              (candidate, index, self) =>
                self.findIndex((item) => item.value === candidate.value) === index
            )}
            onSelect={(value) => onAssign(record.id, String(value))}
          />
          <Button
            size="small"
            disabled={!canComplete}
            onClick={() => onComplete(record.id)}
          >
            Complete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={capabilityStyles.container}>
      <Collapse
        items={[
          {
            key: "create-pricing",
            label: "Create Pricing Request",
            children: (
              <Form layout="vertical" onFinish={onCreate}>
                <Form.Item name="createTitle" label="Title">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createDescription" label="Description">
                  <Input.TextArea disabled={!canCreate} />
                </Form.Item>
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
                <Form.Item name="createOpportunityId" label="Opportunity ID">
                  <Select
                    disabled={!canCreate}
                    allowClear
                    options={opportunities.map((opportunity) => ({
                      value: opportunity.id,
                      label: `${opportunity.title} (${opportunity.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createRequestedById" label="Requested By User ID">
                  <Select
                    disabled={!canCreate}
                    options={[
                      ...tenantUsers.map((entry) => ({
                        value: entry.id,
                        label: `${entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email} (${entry.id.slice(0, 8)})`,
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
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Pricing Request
                </Button>
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
        okButtonProps={{ disabled: !canCreate }}
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
    </div>
  );
};

export default function PricingRequestsPage() {
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

