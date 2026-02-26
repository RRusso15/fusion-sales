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
  ProposalProvider,
  useProposalActions,
  useProposalState,
} from "@/providers/proposalProvider";
import { ProposalStatus, ProposalStatusLabels } from "@/constants/enums";
import type { IProposal } from "@/providers/proposalProvider/context";
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

const ProposalsContent = () => {
  const { role, user } = useAuthState();
  const { proposals, isPending } = useProposalState();
  const { clients } = useClientState();
  const { opportunities } = useOpportunityState();
  const { fetchProposals, createProposal, updateProposal, submitProposal, approveProposal, rejectProposal } =
    useProposalActions();
  const { fetchClients } = useClientActions();
  const { fetchOpportunities, fetchMyOpportunities } = useOpportunityActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canApprove = hasPermission(activeRole, Permission.approveProposal);
  const canReject = hasPermission(activeRole, Permission.rejectProposal);
  const canCreate = hasPermission(activeRole, Permission.createProposal);

  const load = useCallback(async () => {
    await Promise.all([
      fetchProposals({ pageNumber: 1, pageSize: 20 }),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      hasPermission(activeRole, Permission.viewAllOpportunities)
        ? fetchOpportunities({ pageNumber: 1, pageSize: 100 })
        : fetchMyOpportunities({ pageNumber: 1, pageSize: 100 }),
    ]);
  }, [
    fetchProposals,
    fetchClients,
    fetchOpportunities,
    fetchMyOpportunities,
    activeRole,
  ]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const runAction = async (fn: () => Promise<void>, successMessage: string) => {
    try {
      await fn();
      await load();
      message.success(successMessage);
    } catch (error) {
      message.error(getErrorMessage(error, "Action failed"));
    }
  };

  const onCreate = async (values: {
    createOpportunityId?: string;
    createClientId?: string;
    createTitle?: string;
    createDescription?: string;
  }) => {
    try {
      if (values.createOpportunityId && values.createClientId && values.createTitle && canCreate) {
        await createProposal({
          opportunityId: values.createOpportunityId,
          clientId: values.createClientId,
          title: values.createTitle,
          description: values.createDescription,
        });
      }
      await load();
      message.success("Proposal created");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to create proposal"));
    }
  };

  const openEdit = (proposalRecord: IProposal) => {
    if (!canCreate) return;
    setEditingProposalId(proposalRecord.id);
    editForm.setFieldsValue({
      title: proposalRecord.title,
      description: proposalRecord.description,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingProposalId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updateProposal(editingProposalId, {
        title: values.title,
        description: values.description,
      });
      setIsEditOpen(false);
      setEditingProposalId(null);
      await load();
      message.success("Proposal updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update proposal"));
    }
  };

  const columns: TableProps<IProposal>["columns"] = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value?: number) => (
        <Tag>{(ProposalStatusLabels as Record<number, string>)[value ?? 0] ?? "-"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const status = record.status ?? ProposalStatus.Draft;
        return (
          <Space>
            <Button
              size="small"
              disabled={!canCreate || status !== ProposalStatus.Draft}
              onClick={() => openEdit(record)}
            >
              Edit
            </Button>
            <Button
              size="small"
              disabled={status !== ProposalStatus.Draft}
              onClick={() =>
                runAction(
                  () => submitProposal(record.id),
                  "Proposal submitted for approval"
                )
              }
            >
              Submit
            </Button>
            <Button
              size="small"
              type="primary"
              disabled={!canApprove || status !== ProposalStatus.Submitted}
              onClick={() =>
                runAction(
                  () => approveProposal(record.id),
                  "Proposal approved"
                )
              }
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              disabled={!canReject || status !== ProposalStatus.Submitted}
              onClick={() =>
                runAction(
                  () => rejectProposal(record.id, "Rejected from UI"),
                  "Proposal rejected"
                )
              }
            >
              Reject
            </Button>
          </Space>
        );
      },
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
            key: "create-proposal",
            label: "Create Proposal",
            children: (
              <Form layout="vertical" onFinish={onCreate}>
                <Form.Item name="createOpportunityId" label="Opportunity ID">
                  <Select
                    disabled={!canCreate}
                    options={opportunities.map((opportunity) => ({
                      value: opportunity.id,
                      label: `${opportunity.title} (${opportunity.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
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
                <Form.Item name="createTitle" label="Title">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createDescription" label="Description">
                  <Input.TextArea disabled={!canCreate} />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Proposal
                </Button>
              </Form>
            ),
          },
        ]}
      />
      <Table<IProposal>
        rowKey="id"
        loading={isPending}
        dataSource={proposals}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Proposal"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingProposalId(null);
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
        </Form>
      </Modal>
    </div>
  );
};

export default function ProposalsPage() {
  return (
    <AuthGuard>
      <ClientProvider>
        <OpportunityProvider>
          <ProposalProvider>
            <ProposalsContent />
          </ProposalProvider>
        </OpportunityProvider>
      </ClientProvider>
    </AuthGuard>
  );
}
