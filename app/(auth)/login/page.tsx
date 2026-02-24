"use client";
/*
import { Button, Typography, Space, Card } from "antd";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;


export default function LoginPage() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ width: 400 }}>
        
        <Title level={3}>Select Login Type</Title>

        <Text>Choose which dashboard to enter:</Text>

        <Button
          type="primary"
          block
          onClick={() => router.push("/user/dashboard")}
        >
          Login as User
        </Button>

        <Button
          type="default"
          block
          onClick={() => router.push("/admin/dashboard")}
        >
          Login as Admin
        </Button>
        
      </Card>
    </div>
  );
}
  */

import { useRouter } from "next/navigation";
import { Button, Typography, Space, Card } from "antd";
const { Title, Text } = Typography;


export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (role: "user" | "admin") => {
    document.cookie = "auth_token=dummy_token; path=/";

    if (role === "user") {
      router.push("/user/dashboard");
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ width: 400 }}>
        
        <Title level={3}>Select Login Type</Title>

        <Text>Choose which dashboard to enter:</Text>

        <Button onClick={() => handleLogin("user")}>
            Login as User
          </Button>

        <Button onClick={() => handleLogin("admin")}>
          Login as Admin
        </Button>
        
      </Card>
    </div>
  );
}