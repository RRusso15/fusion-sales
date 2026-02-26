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
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole } from "@/constants/roles";
import { hasPermission, Permission } from "@/constants/permissions";
import {
  ContactProvider,
  useContactActions,
  useContactState,
} from "@/providers/contactProvider";
import {
  ClientProvider,
  useClientActions,
  useClientState,
} from "@/providers/clientProvider";
import type { IContact } from "@/providers/contactProvider/context";
import { CapabilityNav } from "@/components/navigation/CapabilityNav";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";

const ContactsContent = () => {
  const { role, user } = useAuthState();
  const { contacts, isPending } = useContactState();
  const { clients } = useClientState();
  const { fetchContacts, createContact, updateContact, setPrimaryContact, deleteContact } = useContactActions();
  const { fetchClients } = useClientActions();
  const loadedRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canSetPrimary = hasPermission(activeRole, Permission.setPrimaryContact);
  const canDelete = hasPermission(activeRole, Permission.deleteContact);
  const canCreate = hasPermission(activeRole, Permission.createContact);

  const load = useCallback(async () => {
    await Promise.all([
      fetchContacts({ pageNumber: 1, pageSize: 20 }),
      fetchClients({ pageNumber: 1, pageSize: 100 }),
    ]);
  }, [fetchContacts, fetchClients]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const onSetPrimary = async (id: string) => {
    try {
      await setPrimaryContact(id);
      await load();
      message.success("Primary contact updated");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to set primary contact"));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteContact(id);
      await load();
      message.success("Contact deleted");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to delete contact"));
    }
  };

  const onCreate = async (values: {
    createClientId?: string;
    createFirstName?: string;
    createLastName?: string;
    createEmail?: string;
    createPhone?: string;
    createPosition?: string;
    createPrimary?: boolean;
  }) => {
    try {
      if (values.createClientId && values.createFirstName && values.createLastName && canCreate) {
        await createContact({
          clientId: values.createClientId,
          firstName: values.createFirstName,
          lastName: values.createLastName,
          email: values.createEmail,
          phoneNumber: values.createPhone,
          position: values.createPosition,
          isPrimaryContact: values.createPrimary,
        });
      }
      await load();
      message.success("Contact created");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to create contact"));
    }
  };

  const openEdit = (contact: IContact) => {
    if (!canCreate) return;
    setEditingContactId(contact.id);
    editForm.setFieldsValue({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      position: contact.position,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingContactId || !canCreate) return;
    try {
      const values = await editForm.validateFields();
      await updateContact(editingContactId, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        position: values.position,
      });
      setIsEditOpen(false);
      setEditingContactId(null);
      await load();
      message.success("Contact updated");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update contact"));
    }
  };

  const columns: TableProps<IContact>["columns"] = [
    { title: "First Name", dataIndex: "firstName", key: "firstName" },
    { title: "Last Name", dataIndex: "lastName", key: "lastName" },
    { title: "Email", dataIndex: "email", key: "email" },
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
            disabled={!canSetPrimary}
            onClick={() => onSetPrimary(record.id)}
          >
            Set Primary
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
        <Typography.Title level={3}>Contacts</Typography.Title>
        <div style={capabilityStyles.actions}>
          <Button onClick={() => load()}>Refresh</Button>
          <CapabilityNav />
        </div>
      </Card>
      <Collapse
        items={[
          {
            key: "create-contact",
            label: "Create Contact",
            children: (
              <Form layout="vertical" onFinish={onCreate}>
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
                <Form.Item name="createFirstName" label="First Name">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createLastName" label="Last Name">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createEmail" label="Email">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createPhone" label="Phone">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createPosition" label="Position">
                  <Input disabled={!canCreate} />
                </Form.Item>
                <Form.Item name="createPrimary" label="Is Primary" valuePropName="checked">
                  <Switch disabled={!canCreate} />
                </Form.Item>
                <Button type="primary" htmlType="submit" disabled={!canCreate}>
                  Create Contact
                </Button>
              </Form>
            ),
          },
        ]}
      />
      <Table<IContact>
        rowKey="id"
        loading={isPending}
        dataSource={contacts}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Contact"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingContactId(null);
        }}
        onOk={onEditSave}
        okButtonProps={{ disabled: !canCreate }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="firstName" label="First Name">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone">
            <Input disabled={!canCreate} />
          </Form.Item>
          <Form.Item name="position" label="Position">
            <Input disabled={!canCreate} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default function ContactsPage() {
  return (
    <AuthGuard>
      <ClientProvider>
        <ContactProvider>
          <ContactsContent />
        </ContactProvider>
      </ClientProvider>
    </AuthGuard>
  );
}
