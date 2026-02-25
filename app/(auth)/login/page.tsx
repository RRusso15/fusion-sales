"use client";

import { Card, Form, Input, Button, Typography, message } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuthActions();
  const { isPending } = useAuthState();
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      await login(values.email, values.password);
      message.success("Login successful");
      router.push("/");
    } catch {
      message.error("Login failed");
    }
  };

  return (
    <Card title="Login" style={{ width: 400 }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true }]}
        >
          <Input.Password />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={isPending}
          block
        >
          Login
        </Button>
      </Form>

      <Typography.Paragraph style={{ marginTop: 16 }}>
        No account? <a href="/register">Register</a>
      </Typography.Paragraph>
    </Card>
  );
}