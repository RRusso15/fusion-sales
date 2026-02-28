"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
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
  OpportunityProvider,
  useOpportunityActions,
  useOpportunityState,
} from "@/providers/opportunityProvider";
import {
  OpportunityStage,
  OpportunityStageLabels,
  OpportunitySourceLabels,
  OpportunitySourceValue,
  OpportunityStageValue,
} from "@/constants/enums";
import { capabilityStyles } from "../capability.styles";
import type { IOpportunity } from "@/providers/opportunityProvider/context";
import { getErrorMessage } from "@/utils/requestError";
import {
  ClientProvider,
  useClientActions,
  useClientState,
} from "@/providers/clientProvider";
import {
  ContactProvider,
  useContactActions,
  useContactState,
} from "@/providers/contactProvider";
import {
  UsersProvider,
  useUsersActions,
  useUsersState,
} from "@/providers/usersProvider";

const OpportunitiesContent = () => {
  const params = useParams<{ clientId?: string }>();
  const clientId = typeof params?.clientId === "string" ? params.clientId : undefined;
  const { role, user } = useAuthState();
  const { opportunities, isPending } = useOpportunityState();
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { users: tenantUsers } = useUsersState();
  const { fetchOpportunities, fetchMyOpportunities, createOpportunity, updateOpportunity, assignOpportunity, moveStage } =
    useOpportunityActions();
  const { fetchClients } = useClientActions();
  const { fetchContacts, fetchContactsByClient } = useContactActions();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const createClientId = Form.useWatch("createClientId", createForm);

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canSeeAll = hasPermission(activeRole, Permission.viewAllOpportunities);
  const canUpdateStage = hasPermission(activeRole, Permission.updateOpportunityStage);
  const canCloseOpportunity = hasPermission(activeRole, Permission.closeOpportunity);
  const canCreate = hasPermission(activeRole, Permission.createOpportunity);
  const canAssign = hasPermission(activeRole, Permission.assignOpportunity);

  const load = useCallback(async () => {
    const opportunitiesParams = {
      pageNumber: 1,
      pageSize: 20,
      ...(clientId ? { clientId } : {}),
    };
    const contactLoad = clientId
      ? fetchContactsByClient(clientId)
      : fetchContacts({ pageNumber: 1, pageSize: 200 });

    if (canSeeAll) {
      await Promise.all([
        fetchOpportunities(opportunitiesParams),
        fetchClients({ pageNumber: 1, pageSize: 100 }),
        contactLoad,
        fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
      ]);
      return;
    }
    await Promise.all([
      fetchMyOpportunities(opportunitiesParams),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      contactLoad,
      fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
    ]);
  }, [
    clientId,
    canSeeAll,
    fetchMyOpportunities,
    fetchOpportunities,
    fetchClients,
    fetchContactsByClient,
    fetchContacts,
    fetchUsers,
  ]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const handleAdvance = async (id: string) => {
    try {
      const record = opportunities.find((item) => item.id === id);
      const currentStage = record?.stage ?? OpportunityStage.Lead;
      if (currentStage >= OpportunityStage.Negotiation) {
        message.info("Use Close Won or Close Lost to complete this opportunity.");
        return;
      }
      const nextStage = (currentStage + 1) as OpportunityStageValue;
      await moveStage(id, nextStage, "Advanced from UI workflow");
      await load();
      message.success("Stage advanced");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to advance stage"));
    }
  };

  const handleClose = async (id: string, stage: OpportunityStageValue) => {
    try {
      await moveStage(id, stage, "Closed via workflow");
      await load();
      message.success(
        stage === OpportunityStage.ClosedWon
          ? "Moved to Closed Won"
          : "Moved to Closed Lost"
      );
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to update opportunity stage"));
    }
  };

  const onCreateAssign = async (values: {
    createTitle?: string;
    createClientId?: string;
    createContactId?: string;
    createValue?: number;
    createStage?: number;
    createSource?: number;
    assignId?: string;
    assignUserId?: string;
  }) => {
    try {
      if (values.createTitle && (clientId || values.createClientId) && canCreate) {
        await createOpportunity({
          title: values.createTitle,
          clientId: clientId ?? values.createClientId,
          contactId: values.createContactId,
          estimatedValue: values.createValue,
          stage: values.createStage as OpportunityStageValue | undefined,
          source: values.createSource as OpportunitySourceValue | undefined,
        });
      }
      if (values.assignId && values.assignUserId && canAssign) {
        await assignOpportunity(values.assignId, values.assignUserId);
      }
      await load();
      message.success("Opportunity action completed");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to process opportunity action"));
    }
  };

  const openEdit = (opportunityRecord: IOpportunity) => {
    if (!canCreate) return;
    setEditingOpportunityId(opportunityRecord.id);
    editForm.setFieldsValue({
      title: opportunityRecord.title,
      estimatedValue: opportunityRecord.estimatedValue,
      probability: opportunityRecord.probability,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingOpportunityId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updateOpportunity(editingOpportunityId, {
        title: values.title,
        estimatedValue: values.estimatedValue,
        probability: values.probability,
      });
      setIsEditOpen(false);
      setEditingOpportunityId(null);
      await load();
      message.success("Opportunity updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update opportunity"));
    }
  };

  const columns: TableProps<IOpportunity>["columns"] = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (value?: number) => {
        const stage = value ?? 0;
        const colorByStage: Record<number, string> = {
          [OpportunityStage.Lead]: "default",
          [OpportunityStage.Qualified]: "blue",
          [OpportunityStage.Proposal]: "purple",
          [OpportunityStage.Negotiation]: "orange",
          [OpportunityStage.ClosedWon]: "green",
          [OpportunityStage.ClosedLost]: "red",
        };
        return (
          <Tag color={colorByStage[stage] ?? "default"}>
            {(OpportunityStageLabels as Record<number, string>)[stage] ?? "-"}
          </Tag>
        );
      },
    },
    {
      title: "Workflow",
      key: "workflow",
      render: (_, record) => {
        const stage = record.stage ?? OpportunityStage.Lead;
        const closed =
          stage === OpportunityStage.ClosedWon ||
          stage === OpportunityStage.ClosedLost;

        return (
          <Space>
            <Button size="small" onClick={() => openEdit(record)} disabled={!canCreate}>
              Edit
            </Button>
            <Button
              size="small"
              disabled={!canUpdateStage || closed}
              onClick={() => handleAdvance(record.id)}
            >
              Advance
            </Button>
            <Button
              size="small"
              disabled={!canCloseOpportunity || closed}
              onClick={() =>
                handleClose(record.id, OpportunityStage.ClosedWon)
              }
            >
              Close Won (5)
            </Button>
            <Button
              size="small"
              danger
              disabled={!canCloseOpportunity || closed}
              onClick={() =>
                handleClose(record.id, OpportunityStage.ClosedLost)
              }
            >
              Close Lost (6)
            </Button>
          </Space>
        );
      },
    },
  ];

  const assignableUsers = [
    ...tenantUsers.map((entry) => ({
      userId: entry.id,
      userName: entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email,
    })),
  ].filter(
    (candidate, index, self) =>
      candidate.userId &&
      self.findIndex((item) => item.userId === candidate.userId) === index
  );
  const filteredContacts = createClientId
    ? contacts.filter((contact) => contact.clientId === createClientId)
    : contacts;

  return (
    <div style={capabilityStyles.container}>
      <Collapse
        items={[
          {
            key: "create-opportunity",
            label: "Create Opportunity",
            children: (
              <Form form={createForm} layout="vertical" onFinish={onCreateAssign}>
                <Form.Item name="createTitle" label="Title">
                  <Input disabled={!canCreate} />
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
                <Form.Item name="createContactId" label="Contact ID">
                  <Select
                    disabled={!canCreate}
                    options={filteredContacts.map((contact) => ({
                      value: contact.id,
                      label: `${contact.firstName} ${contact.lastName} (${contact.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createValue" label="Estimated Value">
                  <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createStage" label="Stage">
                  <Select
                    disabled={!canCreate}
                    options={Object.entries(OpportunityStageLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="createSource" label="Source">
                  <Select
                    disabled={!canCreate}
                    options={Object.entries(OpportunitySourceLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Opportunity
                </Button>
              </Form>
            ),
          },
          {
            key: "assign-opportunity",
            label: "Assign Opportunity",
            children: (
              <Form layout="vertical" onFinish={onCreateAssign}>
                <Form.Item name="assignId" label="Opportunity ID">
                  <Select
                    disabled={!canAssign}
                    options={opportunities.map((opportunity) => ({
                      value: opportunity.id,
                      label: `${opportunity.title} (${opportunity.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="assignUserId" label="User ID">
                  <Select
                    disabled={!canAssign}
                    options={assignableUsers.map((entry) => ({
                      value: entry.userId,
                      label: `${entry.userName} (${entry.userId.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canAssign}>
                  Assign Opportunity
                </Button>
              </Form>
            ),
          },
        ]}
      />
      <Table<IOpportunity>
        rowKey="id"
        loading={isPending}
        dataSource={opportunities}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Opportunity"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingOpportunityId(null);
        }}
        onOk={onEditSave}
        okButtonProps={{ disabled: !canCreate }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Title">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="estimatedValue" label="Estimated Value">
            <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="probability" label="Probability">
            <InputNumber style={{ width: "100%" }} disabled={!canCreate} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export function OpportunitiesModule() {
  return (
    <AuthGuard>
      <UsersProvider>
        <ClientProvider>
          <ContactProvider>
            <OpportunityProvider>
              <OpportunitiesContent />
            </OpportunityProvider>
          </ContactProvider>
        </ClientProvider>
      </UsersProvider>
    </AuthGuard>
  );
}

export default function OpportunitiesPage() {
  return <OpportunitiesModule />;
}

