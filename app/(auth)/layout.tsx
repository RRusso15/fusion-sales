"use client";
import { Layout } from "antd";
import { authStyles } from "./auth.styles";
import "./auth.responsive.css";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRegister = pathname.includes("register");
  return (
    <Layout style={authStyles.layout}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            ...authStyles.container,
            flexDirection: isRegister ? "row-reverse" : "row",
          }}
          className="auth-container"
        >
          <div style={authStyles.leftPanel} />
          <div style={authStyles.rightPanel}>{children}</div>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}