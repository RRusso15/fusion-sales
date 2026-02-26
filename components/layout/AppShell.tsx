"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChartOutlined,
  ContactsOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FundOutlined,
  LogoutOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Typography } from "antd";
import { appShellStyles } from "./appShell.styles";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { hasPermission, Permission } from "@/constants/permissions";
import { normalizeRole } from "@/constants/roles";

const publicPaths = new Set(["/login", "/register", "/unauthorized"]);

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/opportunities": "Opportunities",
  "/activities": "Activities",
  "/contracts": "Contracts",
  "/clients": "Clients",
  "/contacts": "Contacts",
  "/proposals": "Proposals",
  "/pricingrequests": "Pricing Requests",
  "/documents": "Documents",
  "/notes": "Notes",
  "/reports": "Reports",
  "/admin": "Admin",
  "/admin/users": "Admin Users",
  "/admin/settings": "Admin Settings",
  "/sales": "Sales Workspace",
  "/sales/contracts/expiring": "Expiring Contracts",
};

const pageSubtitles: Record<string, string> = {
  "/dashboard": "Welcome back, here's your sales overview.",
  "/opportunities": "Track and progress your pipeline stages from lead to close.",
  "/activities": "Plan, assign, and complete sales follow-up activities.",
  "/contracts": "Manage contract lifecycle, activation, and renewals.",
  "/clients": "Maintain your organisation's client directory and details.",
  "/contacts": "Manage client contacts and primary communication owners.",
  "/proposals": "Create, submit, and manage proposal approvals.",
  "/pricingrequests": "Coordinate pricing requests and assignment workflow.",
  "/documents": "Access and manage shared documents across entities.",
  "/notes": "Capture and review contextual notes across records.",
  "/reports": "Review sales performance and pipeline reporting metrics.",
  "/admin": "Monitor organisation-wide activity and control center metrics.",
  "/admin/users": "Create and manage organisation users and roles.",
  "/admin/settings": "Manage tenant configuration and onboarding context.",
  "/sales": "Monitor your day-to-day sales execution workspace.",
  "/sales/contracts/expiring": "Review contracts nearing expiry and take renewal action.",
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, isAuthenticated } = useAuthState();
  const { logout } = useAuthActions();

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const isPublicPath = publicPaths.has(pathname);

  if (isPublicPath || !isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
    { href: "/opportunities", label: "Opportunities", icon: <FundOutlined /> },
    { href: "/activities", label: "Activities", icon: <SolutionOutlined /> },
    { href: "/contracts", label: "Contracts", icon: <FileDoneOutlined /> },
    { href: "/clients", label: "Clients", icon: <TeamOutlined /> },
    { href: "/contacts", label: "Contacts", icon: <ContactsOutlined /> },
    { href: "/proposals", label: "Proposals", icon: <FileTextOutlined /> },
    { href: "/pricingrequests", label: "Pricing", icon: <DollarOutlined /> },
    { href: "/documents", label: "Documents", icon: <FolderOpenOutlined /> },
    { href: "/notes", label: "Notes", icon: <FileTextOutlined /> },
    ...(hasPermission(activeRole, Permission.viewReports)
      ? [{ href: "/reports", label: "Reports", icon: <BarChartOutlined /> }]
      : []),
    ...(hasPermission(activeRole, Permission.manageUsers)
      ? [{ href: "/admin/users", label: "Admin Users", icon: <UserOutlined /> }]
      : []),
    ...(hasPermission(activeRole, Permission.manageSettings)
      ? [{ href: "/admin/settings", label: "Admin Settings", icon: <SettingOutlined /> }]
      : []),
  ];

  const activeLabel =
    pageTitles[pathname] ??
    pageTitles[Object.keys(pageTitles).find((route) => pathname.startsWith(route)) ?? "/dashboard"] ??
    "Dashboard";
  const activeSubtitle =
    pageSubtitles[pathname] ??
    pageSubtitles[
      Object.keys(pageSubtitles).find((route) => pathname.startsWith(route)) ?? "/dashboard"
    ] ??
    "Welcome back.";

  return (
    <Layout style={appShellStyles.root}>
      <aside style={appShellStyles.sidebar}>
        <div style={appShellStyles.brandRow}>
          <div>
            <Typography.Title style={appShellStyles.brandTitle}>Fusion Sales</Typography.Title>
            <Typography.Text style={appShellStyles.brandSubTitle}>
              Fueling Sales Performance
            </Typography.Text>
          </div>
        </div>

        <nav style={appShellStyles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...appShellStyles.navItem,
                  ...(isActive ? appShellStyles.navItemActive : {}),
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={appShellStyles.logoutWrap}>
          <Button
            ghost
            style={appShellStyles.logoutButton}
            icon={<LogoutOutlined />}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </aside>

      <Layout.Content style={appShellStyles.main}>
        <div style={appShellStyles.headingWrap}>
          <div style={appShellStyles.headingTextWrap}>
            <Typography.Title level={1} style={appShellStyles.headingTitle}>
              {activeLabel}
            </Typography.Title>
            <Typography.Text style={appShellStyles.headingSubTitle}>
              {activeSubtitle}
            </Typography.Text>
          </div>
          <div style={appShellStyles.headingLogoWrap}>
            <Image
              src="/images/logo.png"
              alt="Fusion Sales logo"
              fill
              sizes="96px"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>
        {children}
      </Layout.Content>
    </Layout>
  );
};
