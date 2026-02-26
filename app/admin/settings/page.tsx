"use client";

import Link from "next/link";
import { Button, Card, Col, Form, Input, Row, Select, Space, Typography, message } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { Roles } from "@/constants/roles";
import { useAuthState } from "@/providers/authProvider";
import { getAxiosInstance } from "@/utils/axiosInstance";

interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: "SalesRep" | "SalesManager" | "BusinessDevelopmentManager";
}

export default function AdminSettingsPage() {
  const { currentUser, tenantId } = useAuthState();
  const axios = getAxiosInstance();
  const [form] = Form.useForm<CreateUserForm>();

  const handleCreateUser = async (values: CreateUserForm) => {
    const activeTenantId = tenantId ?? currentUser?.tenantId;
    if (!activeTenantId) {
      message.error("Tenant ID missing in current session.");
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
      message.success("User created successfully.");
      form.resetFields();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        message.error("Validation error: check fields or duplicate email.");
        return;
      }
      if (status === 403) {
        message.error("Access denied for this action.");
        return;
      }
      message.error("Unable to create user.");
    }
  };

  return (
    <AuthGuard requiredRoles={[Roles.Admin]} redirectTo="/unauthorized">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Typography.Title level={3}>Admin Settings</Typography.Title>
          <Typography.Paragraph>
            Manage tenant context and organisation onboarding actions.
          </Typography.Paragraph>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">Tenant ID</Typography.Text>
              <Typography.Paragraph copyable>
                {tenantId ?? currentUser?.tenantId ?? "Not available"}
              </Typography.Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">Admin Email</Typography.Text>
              <Typography.Paragraph>
                {currentUser?.email ?? "-"}
              </Typography.Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">Admin Name</Typography.Text>
              <Typography.Paragraph>
                {`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() || "-"}
              </Typography.Paragraph>
            </Col>
          </Row>
          <Space>
            <Link href="/admin/users">
              <Button>User Management</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </Space>
        </Card>

        <Card title="Create Organisation User">
          <Form<CreateUserForm>
            layout="vertical"
            form={form}
            onFinish={handleCreateUser}
            initialValues={{ role: "SalesRep" }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="firstName"
                  label="First Name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastName"
                  label="Last Name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Required" },
                    { min: 6, message: "Minimum 6 characters" },
                  ]}
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
                <Form.Item
                  name="role"
                  label="Role"
                  rules={[{ required: true, message: "Required" }]}
                >
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
            <Button type="primary" htmlType="submit">
              Create User
            </Button>
          </Form>
        </Card>
      </Space>
    </AuthGuard>
  );
}
