"use client";

import { useEffect, useMemo } from "react";
import { App, Form, Input, Button, Typography, Checkbox, Alert, Row, Col } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { authStyles } from "../auth.styles";
import Link from "next/link";
import Image from "next/image";
import { normalizeRole, Roles } from "@/constants/roles";
import type { UserRole } from "@/providers/authProvider/context";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  isAdminTenant?: boolean;
  tenantName?: string;
}

type JoinRole = Exclude<UserRole, "Admin">;

const INVITE_ALLOWED_ROLES: JoinRole[] = [
  Roles.SalesRep,
  Roles.SalesManager,
  Roles.BusinessDevelopmentManager,
];

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isJoinRole = (value?: string): value is JoinRole =>
  !!value && INVITE_ALLOWED_ROLES.includes(value as JoinRole);

const isGuid = (value?: string) => !!value && GUID_REGEX.test(value);

export default function RegisterPage() {
  const { message: appMessage } = App.useApp();
  const { register } = useAuthActions();
  const { isPending } = useAuthState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm<RegisterFormValues>();
  const isAdminTenant = Form.useWatch("isAdminTenant", form);

  const inviteConfig = useMemo(() => {
    const tenantIdFromUrl = searchParams.get("tenantId")?.trim() ?? "";
    if (!tenantIdFromUrl) {
      return {
        isInviteMode: false,
        tenantId: undefined,
        role: undefined,
        email: undefined,
        error: undefined,
      };
    }

    const roleFromUrl = searchParams.get("role")?.trim() ?? "";
    const normalizedRole = normalizeRole(roleFromUrl);
    const emailFromUrl = searchParams.get("email")?.trim() ?? "";

    if (!isGuid(tenantIdFromUrl)) {
      return {
        isInviteMode: true,
        tenantId: tenantIdFromUrl,
        role: undefined,
        email: emailFromUrl || undefined,
        error: "Invalid invite link: tenantId is not a valid GUID.",
      };
    }

    if (normalizedRole === Roles.Admin) {
      return {
        isInviteMode: true,
        tenantId: tenantIdFromUrl,
        role: undefined,
        email: emailFromUrl || undefined,
        error: "Invalid invite link: Admin role cannot be assigned from an invite.",
      };
    }

    if (!isJoinRole(normalizedRole)) {
      return {
        isInviteMode: true,
        tenantId: tenantIdFromUrl,
        role: undefined,
        email: emailFromUrl || undefined,
        error:
          "Invalid invite link: role must be SalesRep, SalesManager, or BusinessDevelopmentManager.",
      };
    }

    return {
      isInviteMode: true,
      tenantId: tenantIdFromUrl,
      role: normalizedRole,
      email: emailFromUrl || undefined,
      error: undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    if (!inviteConfig.isInviteMode) return;
    form.setFieldsValue({
      isAdminTenant: false,
      email: inviteConfig.email,
    });
  }, [form, inviteConfig]);

  const buildRegisterPayload = (values: RegisterFormValues) => {
    const basePayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phoneNumber: values.phoneNumber,
    };

    if (inviteConfig.isInviteMode) {
      if (!inviteConfig.tenantId || !inviteConfig.role) {
        throw new Error("Invalid invite details.");
      }

      return {
        ...basePayload,
        tenantId: inviteConfig.tenantId,
        role: inviteConfig.role,
      };
    }

    if (values.isAdminTenant) {
      return {
        ...basePayload,
        tenantName: values.tenantName?.trim(),
      };
    }

    return {
      ...basePayload,
      role: Roles.SalesRep,
    };
  };

  const onFinish = async (values: RegisterFormValues) => {
    try {
      if (inviteConfig.isInviteMode && inviteConfig.error) {
        appMessage.error(inviteConfig.error);
        return;
      }

      await register(buildRegisterPayload(values));
      appMessage.success("Registration successful");
      router.push("/");
    } catch {
      appMessage.error("Registration failed");
    }
  };

  return (
    <>
      <div style={authStyles.logoContainer}>
        <Image
          src="/images/logo.png"
          alt="Fusion Sales Logo"
          width={200}
          height={200}
          style={authStyles.logo}
          priority
        />
      </div>

      <Typography.Title level={3} style={authStyles.title}>
        Create Account
      </Typography.Title>

      <Typography.Text style={authStyles.subtitle}>
        Enter your details to get started
      </Typography.Text>

      <div style={authStyles.formContainer}>
        <Form<RegisterFormValues> form={form} layout="vertical" onFinish={onFinish}>
          {inviteConfig.isInviteMode && !inviteConfig.error && inviteConfig.role ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              title={`You are joining an existing organisation as ${inviteConfig.role}`}
            />
          ) : null}

          {inviteConfig.isInviteMode && inviteConfig.error ? (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              title={inviteConfig.error}
            />
          ) : null}

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 8 }}
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 8 }}
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 8 }}
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                  ...(inviteConfig.isInviteMode && inviteConfig.email
                    ? [
                        {
                          validator: async (_: unknown, value: string) => {
                            if (!value) return Promise.resolve();
                            if (value.trim().toLowerCase() === inviteConfig.email?.toLowerCase()) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Email must match the invited email address.")
                            );
                          },
                        },
                      ]
                    : []),
                ]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 6 }}
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 6 }}
                label="Phone Number"
                name="phoneNumber"
              >
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          {!inviteConfig.isInviteMode ? (
            <>
              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 6 }}
                name="isAdminTenant"
                valuePropName="checked"
              >
                <Checkbox>Create new organization as Admin</Checkbox>
              </Form.Item>

              <Form.Item
                style={{ ...authStyles.formItem, marginBottom: 6 }}
                label="Tenant Name"
                name="tenantName"
                rules={
                  isAdminTenant
                    ? [{ required: true, message: "Please enter tenant name" }]
                    : []
                }
              >
                <Input size="large" disabled={!isAdminTenant} />
              </Form.Item>
            </>
          ) : null}

          <Form.Item>
            <div style={authStyles.buttonContainer}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                style={authStyles.button}
              >
                Register
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>

      
      <Typography.Text>
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </Typography.Text>
    </>
  );
}







