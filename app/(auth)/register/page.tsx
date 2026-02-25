"use client";

import { Card, Form, Input, Button, Typography, message } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register } = useAuthActions();
  const { isPending } = useAuthState();
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      await register(
        values.firstName,
        values.lastName,
        values.email,
        values.password
      );
      message.success("Registration successful");
      router.push("/");
    } catch {
      message.error("Registration failed");
    }
  };

  return (
    <Card title="Register" style={{ width: 400 }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="email" label="Email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={isPending}
          block
        >
          Register
        </Button>
      </Form>

      <Typography.Paragraph style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Login</a>
      </Typography.Paragraph>
    </Card>
  );
}