"use client";

import { AuthProvider } from "@/providers/authProvider";
import "antd/dist/reset.css";
import { ConfigProvider, theme as antdTheme } from "antd";
import themeConfig from "@/config/theme.json";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ConfigProvider
            theme={{
              ...themeConfig,
              algorithm: antdTheme.defaultAlgorithm, 
              // optionally: darkAlgorithm
            }}
          >
            {children}
          </ConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}