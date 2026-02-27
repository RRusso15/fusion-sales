"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Collapse,
  DatePicker,
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
  ActivityProvider,
  useActivityActions,
  useActivityState,
} from "@/providers/activityProvider";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import type { IActivity } from "@/providers/activityProvider/context";
import type {
  ActivityTypeValue,
  PriorityValue,
  RelatedToTypeValue,
} from "@/constants/enums";
import {
  ActivityStatus,
  ActivityStatusLabels,
  RelatedToType,
  ActivityTypeLabels,
  PriorityLabels,
  RelatedToTypeLabels,
} from "@/constants/enums";
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
  ProposalProvider,
  useProposalActions,
  useProposalState,
} from "@/providers/proposalProvider";
import {
  ContractProvider,
  useContractActions,
  useContractState,
} from "@/providers/contractProvider";
import {
  UsersProvider,
  useUsersActions,
  useUsersState,
} from "@/providers/usersProvider";
import dayjs, { Dayjs } from "dayjs";

const ActivitiesContent = () => {
  const { role, user } = useAuthState();
  const { activities, isPending } = useActivityState();
  const { clients } = useClientState();
  const { opportunities } = useOpportunityState();
  const { proposals } = useProposalState();
  const { contracts } = useContractState();
  const { users: tenantUsers } = useUsersState();
  const { fetchActivities, fetchMyActivities, createActivity, updateActivity, cancelActivity, completeActivity, deleteActivity } =
    useActivityActions();
  const { fetchClients } = useClientActions();
  const { fetchOpportunities, fetchMyOpportunities } = useOpportunityActions();
  const { fetchProposals } = useProposalActions();
  const { fetchContracts } = useContractActions();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const createRelatedType = Form.useWatch("createRelatedType", createForm);

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canViewAll =
    activeRole === Roles.Admin ||
    activeRole === Roles.SalesManager ||
    activeRole === Roles.BusinessDevelopmentManager;
  const canDelete = hasPermission(activeRole, Permission.deleteActivity);
  const canComplete = hasPermission(activeRole, Permission.completeActivity);
  const canCreate = hasPermission(activeRole, Permission.createActivity);

  const load = useCallback(async () => {
    if (canViewAll) {
      await Promise.all([
        fetchActivities({ pageNumber: 1, pageSize: 20 }),
        fetchClients({ pageNumber: 1, pageSize: 100 }),
        fetchOpportunities({ pageNumber: 1, pageSize: 100 }),
        fetchProposals({ pageNumber: 1, pageSize: 100 }),
        fetchContracts({ pageNumber: 1, pageSize: 100 }),
        fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
      ]);
      return;
    }
    await Promise.all([
      fetchMyActivities({ pageNumber: 1, pageSize: 20 }),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
      fetchMyOpportunities({ pageNumber: 1, pageSize: 100 }),
      fetchProposals({ pageNumber: 1, pageSize: 100 }),
      fetchContracts({ pageNumber: 1, pageSize: 100 }),
      fetchUsers({ pageNumber: 1, pageSize: 200, isActive: true }),
    ]);
  }, [
    canViewAll,
    fetchActivities,
    fetchMyActivities,
    fetchClients,
    fetchOpportunities,
    fetchMyOpportunities,
    fetchProposals,
    fetchContracts,
    fetchUsers,
  ]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const onComplete = async (id: string) => {
    try {
      await completeActivity(id, "Completed from activities module");
      await load();
      message.success("Activity completed");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to complete activity"));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteActivity(id);
      await load();
      message.success("Activity deleted");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to delete activity"));
    }
  };

  const onCreate = async (values: {
    createType?: number;
    createSubject?: string;
    createDescription?: string;
    createPriority?: number;
    createDueDate?: Dayjs;
    createAssignedToId?: string;
    createRelatedType?: number;
    createRelatedId?: string;
  }) => {
    try {
      if (!canCreate) return;
      await createActivity({
        type: values.createType as ActivityTypeValue,
        subject: values.createSubject,
        description: values.createDescription,
        priority: values.createPriority as PriorityValue | undefined,
        dueDate: values.createDueDate?.format("YYYY-MM-DD"),
        assignedToId: values.createAssignedToId,
        relatedToType: values.createRelatedType as RelatedToTypeValue | undefined,
        relatedToId: values.createRelatedId,
      });
      await load();
      message.success("Activity created");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to save activity"));
    }
  };

  const onCancelById = async (values: { cancelId?: string }) => {
    try {
      if (!values.cancelId || !canCreate) return;
      await cancelActivity(values.cancelId);
      await load();
      message.success("Activity cancelled");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to cancel activity"));
    }
  };

  const openEdit = (activityRecord: IActivity) => {
    if (!canCreate) return;
    setEditingActivityId(activityRecord.id);
    editForm.setFieldsValue({
      subject: activityRecord.subject,
      description: activityRecord.description,
      dueDate: activityRecord.dueDate ? dayjs(activityRecord.dueDate) : undefined,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingActivityId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updateActivity(editingActivityId, {
        subject: values.subject,
        description: values.description,
        dueDate: values.dueDate ? (values.dueDate as Dayjs).format("YYYY-MM-DD") : undefined,
      });
      setIsEditOpen(false);
      setEditingActivityId(null);
      await load();
      message.success("Activity updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update activity"));
    }
  };

  const columns: TableProps<IActivity>["columns"] = [
    { title: "Subject", dataIndex: "subject", key: "subject" },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value?: number) =>
        (ActivityTypeLabels as Record<number, string>)[value ?? 0] ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value?: number) =>
        (ActivityStatusLabels as Record<number, string>)[value ?? 0] ?? "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            disabled={!canCreate}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            disabled={
              !canComplete ||
              record.status === ActivityStatus.Completed ||
              record.status === ActivityStatus.Cancelled
            }
            onClick={() => onComplete(record.id)}
          >
            Complete
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

  const assigneeOptions = [
    ...tenantUsers.map((entry) => ({
      value: entry.id,
      label: `${entry.fullName || `${entry.firstName} ${entry.lastName}`.trim() || entry.email} (${entry.id.slice(0, 8)})`,
    })),
    ...(user?.id && tenantUsers.every((entry) => entry.id !== user.id)
      ? [{
          value: user.id,
          label:
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
            user.email ||
            "Current User",
        }]
      : []),
  ].filter(
    (candidate, index, self) =>
      self.findIndex((item) => item.value === candidate.value) === index
  );

  const relatedOptions = (() => {
    if (createRelatedType === RelatedToType.Client) {
      return clients.map((client) => ({
        value: client.id,
        label: `${client.name} (${client.id.slice(0, 8)})`,
      }));
    }
    if (createRelatedType === RelatedToType.Opportunity) {
      return opportunities.map((opportunity) => ({
        value: opportunity.id,
        label: `${opportunity.title} (${opportunity.id.slice(0, 8)})`,
      }));
    }
    if (createRelatedType === RelatedToType.Proposal) {
      return proposals.map((proposal) => ({
        value: proposal.id,
        label: `${proposal.title} (${proposal.id.slice(0, 8)})`,
      }));
    }
    if (createRelatedType === RelatedToType.Contract) {
      return contracts.map((contract) => ({
        value: contract.id,
        label: `${contract.title} (${contract.id.slice(0, 8)})`,
      }));
    }
    if (createRelatedType === RelatedToType.Activity) {
      return activities.map((activity) => ({
        value: activity.id,
        label: `${activity.subject} (${activity.id.slice(0, 8)})`,
      }));
    }
    return [];
  })();

  return (
    <div style={capabilityStyles.container}>
      <Collapse
        items={[
          {
            key: "create-activity",
            label: "Create Activity",
            children: (
              <Form form={createForm} layout="vertical" onFinish={onCreate}>
                <Form.Item
                  name="createType"
                  label="Type"
                  rules={[{ required: true, message: "Select activity type" }]}
                >
                  <Select
                    disabled={!canCreate}
                    options={Object.entries(ActivityTypeLabels).map(
                      ([value, label]) => ({
                        value: Number(value),
                        label,
                      })
                    )}
                  />
                </Form.Item>
                <Form.Item
                  name="createSubject"
                  label="Subject"
                  rules={[{ required: true, message: "Enter activity subject" }]}
                >
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createDescription" label="Description">
                  <Input.TextArea disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createPriority" label="Priority">
                  <Select
                    disabled={!canCreate}
                    options={Object.entries(PriorityLabels).map(
                      ([value, label]) => ({
                        value: Number(value),
                        label,
                      })
                    )}
                  />
                </Form.Item>
                <Form.Item
                  name="createDueDate"
                  label="Due Date"
                  rules={[{ required: true, message: "Select due date" }]}
                >
                  <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="createAssignedToId" label="Assigned User ID">
                  <Select
                    disabled={!canCreate}
                    options={assigneeOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="createRelatedType" label="Related Type">
                  <Select
                    disabled={!canCreate}
                    options={Object.entries(RelatedToTypeLabels).map(
                      ([value, label]) => ({
                        value: Number(value),
                        label,
                      })
                    )}
                  />
                </Form.Item>
                <Form.Item name="createRelatedId" label="Related ID">
                  <Select
                    disabled={!canCreate || !createRelatedType}
                    options={relatedOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Activity
                </Button>
              </Form>
            ),
          },
          {
            key: "cancel-activity",
            label: "Cancel Activity",
            children: (
              <Form layout="vertical" onFinish={onCancelById}>
                <Form.Item name="cancelId" label="Activity ID">
                  <Select
                    disabled={!canCreate}
                    options={activities.map((activity) => ({
                      value: activity.id,
                      label: `${activity.subject} (${activity.id.slice(0, 8)})`,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Cancel Activity
                </Button>
              </Form>
            ),
          },
        ]}
      />
      <Table<IActivity>
        rowKey="id"
        loading={isPending}
        dataSource={activities}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Activity"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingActivityId(null);
        }}
        onOk={onEditSave}
        okButtonProps={{ disabled: !canCreate }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="subject" label="Subject">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker disabled={!canCreate} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default function ActivitiesPage() {
  return (
    <AuthGuard>
      <UsersProvider>
        <ClientProvider>
          <OpportunityProvider>
            <ProposalProvider>
              <ContractProvider>
                <ActivityProvider>
                  <ActivitiesContent />
                </ActivityProvider>
              </ContractProvider>
            </ProposalProvider>
          </OpportunityProvider>
        </ClientProvider>
      </UsersProvider>
    </AuthGuard>
  );
}

