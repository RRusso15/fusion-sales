"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole } from "@/constants/roles";
import { hasPermission, Permission } from "@/constants/permissions";
import {
  ClientProvider,
  useClientActions,
  useClientState,
} from "@/providers/clientProvider";
import { ClientTypeLabels } from "@/constants/enums";
import type { ClientTypeValue } from "@/constants/enums";
import type { IClient } from "@/providers/clientProvider/context";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";

const ClientsContent = () => {
  const { role, user } = useAuthState();
  const { clients, isPending } = useClientState();
  const { fetchClients, createClient, updateClient, deleteClient } = useClientActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canDelete = hasPermission(activeRole, Permission.deleteClient);
  const canCreate = hasPermission(activeRole, Permission.createClient);

  const load = useCallback(async () => {
    await fetchClients({ pageNumber: 1, pageSize: 20 });
  }, [fetchClients]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const onDelete = async (id: string) => {
    try {
      await deleteClient(id);
      await load();
      message.success("Client deleted");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to delete client"));
    }
  };

  const onCreate = async (values: {
    createName?: string;
    createIndustry?: string;
    createType?: number;
    createWebsite?: string;
  }) => {
    try {
      if (values.createName && canCreate) {
        await createClient({
          name: values.createName,
          industry: values.createIndustry,
          clientType: values.createType as ClientTypeValue | undefined,
          website: values.createWebsite,
        });
      }
      await load();
      message.success("Client created");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to create client"));
    }
  };

  const openEdit = (client: IClient) => {
    if (!canCreate) return;
    setEditingClientId(client.id);
    editForm.setFieldsValue({
      name: client.name,
      industry: client.industry,
      clientType: client.clientType,
      website: client.website,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingClientId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updateClient(editingClientId, {
        name: values.name,
        industry: values.industry,
        clientType: values.clientType as ClientTypeValue | undefined,
        website: values.website,
      });
      setIsEditOpen(false);
      setEditingClientId(null);
      await load();
      message.success("Client updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update client"));
    }
  };

  const columns: TableProps<IClient>["columns"] = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Industry", dataIndex: "industry", key: "industry" },
    {
      title: "Type",
      dataIndex: "clientType",
      key: "clientType",
      render: (value?: number) => (
        <Tag>{(ClientTypeLabels as Record<number, string>)[value ?? 0] ?? "-"}</Tag>
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
            danger
            disabled={!canDelete}
            onClick={() => onDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={capabilityStyles.container}>
      <Card style={capabilityStyles.header}>
        <div style={capabilityStyles.actions}>
          <Button onClick={() => load()}>Refresh</Button>
        </div>
      </Card>
      <Collapse
        items={[
          {
            key: "create-client",
            label: "Create Client",
            children: (
              <Form layout="vertical" onFinish={onCreate}>
                <Form.Item name="createName" label="Name">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createIndustry" label="Industry">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createType" label="Type">
                  <Select
                    disabled={!canCreate}
                    options={[
                      { value: 1, label: "Government" },
                      { value: 2, label: "Private" },
                      { value: 3, label: "Partner" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="createWebsite" label="Website">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Client
                </Button>
              </Form>
            ),
          },
        ]}
      />
      <Table<IClient>
        rowKey="id"
        loading={isPending}
        dataSource={clients}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Client"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingClientId(null);
        }}
        onOk={onEditSave}
        okButtonProps={{ disabled: !canCreate }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Name">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="industry" label="Industry">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="clientType" label="Type">
            <Select
              disabled={!canCreate}
              options={[
                { value: 1, label: "Government" },
                { value: 2, label: "Private" },
                { value: 3, label: "Partner" },
              ]}
            />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input disabled={!canCreate} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default function ClientsPage() {
  return (
    <AuthGuard>
      <ClientProvider>
        <ClientsContent />
      </ClientProvider>
    </AuthGuard>
  );
}
