"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { Roles } from "@/constants/roles";
import { useAuthState } from "@/providers/authProvider";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  UsersProvider,
  useUsersActions,
  useUsersState,
} from "@/providers/usersProvider";

interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: "SalesRep" | "SalesManager" | "BusinessDevelopmentManager";
}

interface InviteFormValues {
  email: string;
  role: "SalesRep" | "SalesManager" | "BusinessDevelopmentManager";
}

const AdminUsersContent = () => {
  const { message: appMessage } = App.useApp();
  const { tenantId, currentUser } = useAuthState();
  const axios = getAxiosInstance();
  const [form] = Form.useForm<CreateUserForm>();
  const [inviteForm] = Form.useForm<InviteFormValues>();
  const { users, isPending } = useUsersState();
  const { fetchUsers } = useUsersActions();
  const loadedRef = useRef(false);
  const [inviteLink, setInviteLink] = useState("");
  const activeTenantId = useMemo(() => tenantId ?? currentUser?.tenantId, [tenantId, currentUser?.tenantId]);

  const loadTenantUsers = useCallback(async () => {
    await fetchUsers({ pageNumber: 1, pageSize: 100, isActive: true });
  }, [fetchUsers]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadTenantUsers().catch(() => undefined);
  }, [loadTenantUsers]);

  const handleCreateUser = async (values: CreateUserForm) => {
    if (!activeTenantId) {
      appMessage.error("Tenant ID missing in current session.");
      return;
    }

    try {
      await axios.post("/api/auth/register", {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        tenantId: activeTenantId,
        role: values.role,
      });
      appMessage.success("User created.");
      form.resetFields();
      await loadTenantUsers();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        appMessage.error("Validation error or duplicate email.");
        return;
      }
      if (status === 403) {
        appMessage.error("Access denied.");
        return;
      }
      appMessage.error("Failed to create user.");
    }
  };

  const handleGenerateInviteLink = (values: InviteFormValues) => {
    if (!activeTenantId) {
      appMessage.error("Tenant ID missing in current session.");
      return;
    }

    const params = new URLSearchParams({
      tenantId: activeTenantId,
      role: values.role,
      email: values.email.trim(),
    });
    const path = `/register?${params.toString()}`;
    const generatedLink =
      typeof window === "undefined" ? path : `${window.location.origin}${path}`;

    setInviteLink(generatedLink);
    appMessage.success("Invite link generated.");
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) {
      appMessage.warning("Generate an invite link first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      appMessage.success("Invite link copied to clipboard.");
    } catch {
      appMessage.error("Failed to copy invite link.");
    }
  };

  const userColumns: TableProps<(typeof users)[number]>["columns"] = [
    { title: "Name", dataIndex: "fullName", key: "fullName" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      render: (value?: string[]) => (value && value.length > 0 ? value.join(", ") : "-"),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value?: boolean) => (value ? "Active" : "Inactive"),
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (value?: string) => (value ? new Date(value).toLocaleString() : "-"),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value?: string) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Typography.Paragraph>
          Create and view users inside your organisation tenant.
        </Typography.Paragraph>
      </Card>

      <Card title="Organisation Users">
        <Table<(typeof users)[number]>
          style={{ marginTop: 12 }}
          rowKey="id"
          loading={isPending}
          dataSource={Array.isArray(users) ? users : []}
          columns={userColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Card title="Invite User">
        {!activeTenantId ? (
          <Alert
            type="error"
            showIcon
            title="Tenant ID missing in current session. Invite links cannot be generated."
          />
        ) : null}
        <Form<InviteFormValues>
          form={inviteForm}
          layout="vertical"
          onFinish={handleGenerateInviteLink}
          initialValues={{ role: Roles.SalesRep }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email." },
                  { type: "email", message: "Please enter a valid email." },
                ]}
              >
                <Input placeholder="user@company.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "SalesRep", value: Roles.SalesRep },
                    { label: "SalesManager", value: Roles.SalesManager },
                    {
                      label: "BusinessDevelopmentManager",
                      value: Roles.BusinessDevelopmentManager,
                    },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Generate Invite Link
                </Button>
                <Button onClick={handleCopyInviteLink}>Copy to Clipboard</Button>
              </Space>
            </Col>
            <Col xs={24}>
              <Form.Item label="Generated Link">
                <Input readOnly value={inviteLink} placeholder="Generate an invite link to display it here." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Create User">
        <Form<CreateUserForm>
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{ role: "SalesRep" }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true }, { min: 6 }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phoneNumber" label="Phone Number">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "SalesRep", value: "SalesRep" },
                    { label: "SalesManager", value: "SalesManager" },
                    {
                      label: "BusinessDevelopmentManager",
                      value: "BusinessDevelopmentManager",
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit">
              Create User
            </Button>
            <Link href="/admin/settings">
              <Button>Admin Settings</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};

export default function AdminUsersPage() {
  return (
    <AuthGuard requiredRoles={[Roles.Admin]} redirectTo="/unauthorized">
      <UsersProvider>
        <AdminUsersContent />
      </UsersProvider>
    </AuthGuard>
  );
}
