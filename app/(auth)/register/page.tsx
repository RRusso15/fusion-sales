"use client";

import { Form, Input, Button, Typography, message, Checkbox, Select } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useRouter } from "next/navigation";
import { authStyles } from "../auth.styles";
import Link from "next/link";
import Image from "next/image";
import { Roles } from "@/constants/roles";
import type { UserRole } from "@/providers/authProvider/context";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  isAdminTenant?: boolean;
  tenantName?: string;
  tenantId?: string;
  role?: Exclude<UserRole, "Admin">;
}

export default function RegisterPage() {
  const { register } = useAuthActions();
  const { isPending } = useAuthState();
  const router = useRouter();
  const [form] = Form.useForm<RegisterFormValues>();
  const isAdminTenant = Form.useWatch("isAdminTenant", form);

  const onFinish = async (values: RegisterFormValues) => {
    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        tenantName: values.isAdminTenant ? values.tenantName : undefined,
        tenantId: values.isAdminTenant ? undefined : values.tenantId,
        role: values.isAdminTenant ? undefined : values.role ?? Roles.SalesRep,
      });
      message.success("Registration successful");
      router.push("/");
    } catch {
      message.error("Registration failed");
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
          <Form.Item
            style={authStyles.formItem}
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: "Please enter last name" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please enter email" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            label="Phone Number"
            name="phoneNumber"
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            name="isAdminTenant"
            valuePropName="checked"
          >
            <Checkbox>Create new organization as Admin</Checkbox>
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
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

          <Form.Item
            style={authStyles.formItem}
            label="Tenant ID (join existing)"
            name="tenantId"
          >
            <Input size="large" disabled={!!isAdminTenant} />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            label="Role"
            name="role"
            initialValue={Roles.SalesRep}
          >
            <Select
              disabled={!!isAdminTenant}
              options={[
                { value: Roles.SalesRep, label: "SalesRep" },
                { value: Roles.SalesManager, label: "SalesManager" },
                {
                  value: Roles.BusinessDevelopmentManager,
                  label: "BusinessDevelopmentManager",
                },
              ]}
            />
          </Form.Item>

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
      

      <div style={authStyles.bottomBar}>
        <Typography.Text type="secondary">
          &#xA9; {new Date().getFullYear()} Fusion Sales |{" "}
          <Link href="/privacy">Privacy Policy</Link>
        </Typography.Text>
      </div>
    </>
  );
}
