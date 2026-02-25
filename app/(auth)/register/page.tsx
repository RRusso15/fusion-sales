"use client";

import { Form, Input, Button, Typography, message } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useRouter } from "next/navigation";
import { authStyles } from "../auth.styles";
import Link from "next/link";
import Image from "next/image";
import AuthLayout from "../layout";

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
        <Form layout="vertical" onFinish={onFinish}>
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
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password size="large" />
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