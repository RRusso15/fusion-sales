"use client";
import { Layout } from "antd";
import { authStyles } from "./auth.styles";
import "./auth.responsive.css";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRegister = pathname.includes("register");
  return (
    <Layout style={authStyles.layout}>
      <div style={{
        ...authStyles.container, 
        flexDirection: isRegister ? "row-reverse" : "row",
        }}
        className="auth-container"
        >
        <div style={authStyles.leftPanel} />
        <div style={authStyles.rightPanel}>{children}</div>
      </div>
    </Layout>
  );
}