"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Button,
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
import { usePermission } from "@/components/hooks/usePermission";
import {
  ProposalProvider,
  useProposalActions,
  useProposalState,
} from "@/providers/proposalProvider";
import { ProposalStatus, ProposalStatusLabels } from "@/constants/enums";
import type { IProposal } from "@/providers/proposalProvider/context";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import { workflowService } from "@/utils/workflowService";
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
  const params = useParams<{ clientId?: string }>();
  const clientId = typeof params?.clientId === "string" ? params.clientId : undefined;
  const { proposals, isPending } = useProposalState();
  const { clients } = useClientState();
  const { opportunities } = useOpportunityState();
  const { fetchProposals, createProposal, updateProposal, submitProposal, approveProposal, rejectProposal } =
    useProposalActions();
  const { fetchClients } = useClientActions();
  const { fetchOpportunities } = useOpportunityActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { hasPermission, Permission } = usePermission();
  const canApprove = hasPermission(Permission.approveProposal);
  const canReject = hasPermission(Permission.rejectProposal);
  const canCreate = hasPermission(Permission.createProposal);

  const load = useCallback(async () => {
    const proposalParams = {
      pageNumber: 1,
      pageSize: 20,
      ...(clientId ? { clientId } : {}),
    };
    const opportunityParams = {
      pageNumber: 1,
      pageSize: 100,
      ...(clientId ? { clientId } : {}),
    };
    await Promise.all([
      fetchProposals(proposalParams),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      fetchOpportunities(opportunityParams),
    ]);
  }, [
    clientId,
    fetchProposals,
    fetchClients,
    fetchOpportunities,
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

  const handleApprove = async (proposalId: string) => {
    try {
      await approveProposal(proposalId);
      try {
        await workflowService.handleProposalApproved({ proposalId });
      } catch (workflowError) {
        console.error("Proposal approval workflow failed", workflowError);
        message.warning("Primary action succeeded. Follow-up automation failed.");
      }
      await load();
      message.success("Proposal approved");
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
      if (values.createOpportunityId && (clientId || values.createClientId) && values.createTitle && canCreate) {
        await createProposal({
          opportunityId: values.createOpportunityId,
          clientId: clientId ?? values.createClientId,
          title: values.createTitle,
          description: values.createDescription,
        });
        createForm.resetFields();
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
            {canCreate && status === ProposalStatus.Draft ? (
              <Button
                size="small"
                onClick={() => openEdit(record)}
              >
                Edit
              </Button>
            ) : null}
            {status === ProposalStatus.Draft ? (
              <Button
                size="small"
                onClick={() =>
                  runAction(
                    () => submitProposal(record.id),
                    "Proposal submitted for approval"
                  )
                }
              >
                Submit
              </Button>
            ) : null}
            {canApprove && status === ProposalStatus.Submitted ? (
              <Button
                size="small"
                type="primary"
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
            ) : null}
            {canReject && status === ProposalStatus.Submitted ? (
              <Button
                size="small"
                danger
                onClick={() =>
                  runAction(
                    () => rejectProposal(record.id, "Rejected from UI"),
                    "Proposal rejected"
                  )
                }
              >
                Reject
              </Button>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={capabilityStyles.container}>
      <Collapse
        items={[
          {
            key: "create-proposal",
            label: "Create Proposal",
            children: (
              <Form form={createForm} layout="vertical" onFinish={onCreate}>
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
                {!clientId ? (
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
                ) : null}
                <Form.Item name="createTitle" label="Title">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createDescription" label="Description">
                  <Input.TextArea disabled={!canCreate} />
                </Form.Item>
                {canCreate ? (
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Create Proposal
                  </Button>
                ) : null}
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
        okButtonProps={{ style: { display: canCreate ? "inline-flex" : "none" } }}
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

export function ProposalsModule() {
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

export default function ProposalsPage() {
  return <ProposalsModule />;
}

