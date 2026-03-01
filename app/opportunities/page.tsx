"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  App,
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
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { usePermission } from "@/components/hooks/usePermission";
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
import { workflowService } from "@/utils/workflowService";
import { pdfService } from "@/services/pdfService";
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
import { PageTransition } from "@/components/ui/PageTransition";
import { ContentSkeleton } from "@/components/ui/ContentSkeleton";

const OpportunitiesContent = () => {
  const { message: appMessage } = App.useApp();
  const params = useParams<{ clientId?: string }>();
  const clientId = typeof params?.clientId === "string" ? params.clientId : undefined;
  const { opportunities, isPending } = useOpportunityState();
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { users: tenantUsers } = useUsersState();
  const { fetchOpportunities, createOpportunity, updateOpportunity, assignOpportunity, moveStage } =
    useOpportunityActions();
  const { fetchClients } = useClientActions();
  const { fetchContacts, fetchContactsByClient } = useContactActions();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
  const [exportingOpportunityId, setExportingOpportunityId] = useState<string | null>(null);
  const [flashedOpportunityId, setFlashedOpportunityId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const createClientId = Form.useWatch("createClientId", createForm);

  const { hasPermission, Permission } = usePermission();
  const canUpdateStage = hasPermission(Permission.updateOpportunityStage);
  const canCloseOpportunity = hasPermission(Permission.closeOpportunity);
  const canCreate = hasPermission(Permission.createOpportunity);
  const canAssign = hasPermission(Permission.assignOpportunity);

  const load = useCallback(async () => {
    const opportunitiesParams = {
      pageNumber: 1,
      pageSize: 20,
      ...(clientId ? { clientId } : {}),
    };
    const contactLoad = clientId
      ? fetchContactsByClient(clientId)
      : fetchContacts({ pageNumber: 1, pageSize: 200 });

    await Promise.all([
      fetchOpportunities(opportunitiesParams),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      contactLoad,
      fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
    ]);
  }, [
    clientId,
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
        appMessage.info("Use Close Won or Close Lost to complete this opportunity.");
        return;
      }
      const nextStage = (currentStage + 1) as OpportunityStageValue;
      await moveStage(id, nextStage, "Advanced from UI workflow");
      try {
        await workflowService.handleOpportunityStageChange({
          opportunityId: id,
          newStage: nextStage,
        });
      } catch (workflowError) {
        console.error("Opportunity stage workflow failed", workflowError);
        appMessage.warning("Primary action succeeded. Follow-up automation failed.");
      }
      await load();
      setFlashedOpportunityId(id);
      setTimeout(() => setFlashedOpportunityId((current) => (current === id ? null : current)), 280);
      appMessage.success("Stage advanced");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to advance stage"));
    }
  };

  const handleClose = async (id: string, stage: OpportunityStageValue) => {
    try {
      await moveStage(id, stage, "Closed via workflow");
      try {
        await workflowService.handleOpportunityStageChange({
          opportunityId: id,
          newStage: stage,
        });
      } catch (workflowError) {
        console.error("Opportunity close workflow failed", workflowError);
        appMessage.warning("Primary action succeeded. Follow-up automation failed.");
      }
      await load();
      setFlashedOpportunityId(id);
      setTimeout(() => setFlashedOpportunityId((current) => (current === id ? null : current)), 280);
      appMessage.success(
        stage === OpportunityStage.ClosedWon
          ? "Moved to Closed Won"
          : "Moved to Closed Lost"
      );
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to update opportunity stage"));
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
        createForm.resetFields();
      }
      if (values.assignId && values.assignUserId && canAssign) {
        await assignOpportunity(values.assignId, values.assignUserId);
      }
      await load();
      appMessage.success("Opportunity action completed");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to process opportunity action"));
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
      appMessage.success("Opportunity updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      appMessage.error(getErrorMessage(error, "Unable to update opportunity"));
    }
  };

  const handleDownloadSummary = async (opportunityId: string) => {
    setExportingOpportunityId(opportunityId);
    try {
      await pdfService.generateOpportunitySummaryPdf(opportunityId);
      appMessage.success("Download started");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to generate opportunity summary PDF"));
    } finally {
      setExportingOpportunityId(null);
    }
  };

  const columns: TableProps<IOpportunity>["columns"] = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (value?: number, record?: IOpportunity) => {
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
          <Tag
            color={colorByStage[stage] ?? "default"}
            className={record?.id === flashedOpportunityId ? "status-flash" : ""}
          >
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
            {canCreate ? (
              <Button size="small" onClick={() => openEdit(record)}>
                Edit
              </Button>
            ) : null}
            {canUpdateStage && !closed ? (
              <Button
                size="small"
                onClick={() => handleAdvance(record.id)}
              >
                Advance
              </Button>
            ) : null}
            {canCloseOpportunity && !closed ? (
              <Button
                size="small"
                onClick={() =>
                  handleClose(record.id, OpportunityStage.ClosedWon)
                }
              >
                Close Won (5)
              </Button>
            ) : null}
            {canCloseOpportunity && !closed ? (
              <Button
                size="small"
                danger
                onClick={() =>
                  handleClose(record.id, OpportunityStage.ClosedLost)
                }
              >
                Close Lost (6)
              </Button>
            ) : null}
            <Button
              size="small"
              onClick={() => handleDownloadSummary(record.id)}
              loading={exportingOpportunityId === record.id}
              disabled={!!exportingOpportunityId && exportingOpportunityId !== record.id}
            >
              Download Summary
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
    <PageTransition>
      {isPending && opportunities.length === 0 ? (
        <ContentSkeleton variant="table" />
      ) : (
    <div style={capabilityStyles.container} className="fade-in">
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
                {canCreate ? (
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Create Opportunity
                  </Button>
                ) : null}
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
                {canAssign ? (
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Assign Opportunity
                  </Button>
                ) : null}
              </Form>
            ),
          },
        ]}
      />
      <Table<IOpportunity>
        className={`table-fade table-row-hover ${isPending ? "loading" : ""}`}
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
        okButtonProps={{ style: { display: canCreate ? "inline-flex" : "none" } }}
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
      )}
    </PageTransition>
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


