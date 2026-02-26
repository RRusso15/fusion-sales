"use client";

import { Form, Input, Button, Typography, message } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useRouter } from "next/navigation";
import { authStyles } from "../auth.styles";
import Link from "next/link";
import Image from "next/image";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuthActions();
  const { isPending } = useAuthState();
  const router = useRouter();

  const onFinish = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      message.success("Login successful");
      router.push("/");
    } catch {
      message.error("Login failed");
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
        Welcome Back
      </Typography.Title>

      <Typography.Text style={authStyles.subtitle}>
        Enter your details to sign in
      </Typography.Text>

      <div style={authStyles.formContainer}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            style={authStyles.formItem}
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please enter email" }]}
          >
            <Input size="large" placeholder="email@fusionsales.io" />
          </Form.Item>

          <Form.Item
            style={authStyles.formItem}
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password size="large" placeholder="************" />
          </Form.Item>

          <Form.Item style={authStyles.formItem}>
            <div style={authStyles.buttonContainer}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                style={authStyles.button}
              >
                Sign In
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>

      <div style={authStyles.footerText}>
        <Typography.Text>
          Don’t have an account?{" "}
          <Link href="/register">Sign up</Link>
        </Typography.Text>
      </div>

      <div style={authStyles.bottomBar}>
        <Typography.Text type="secondary">
          &#xA9; {new Date().getFullYear()} Fusion Sales |{" "}
          <Link href="/privacy">Privacy Policy</Link>
        </Typography.Text>
      </div>

    </>
  );
}
