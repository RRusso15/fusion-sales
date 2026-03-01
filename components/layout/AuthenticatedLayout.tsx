"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuProps } from "antd";
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
  MenuOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Spin, Typography } from "antd";
import { appShellStyles } from "./appShell.styles";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { hasPermission, Permission } from "@/constants/permissions";
import { resolveUserRole } from "@/constants/roles";

const { Header, Sider, Content } = Layout;
const publicPaths = new Set(["/login", "/register", "/unauthorized"]);

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients/[id]/overview": "Client Overview",
  "/clients/[id]/contacts": "Client Contacts",
  "/clients/[id]/opportunities": "Client Opportunities",
  "/clients/[id]/pricing-requests": "Client Pricing Requests",
  "/clients/[id]/proposals": "Client Proposals",
  "/clients/[id]/contracts": "Client Contracts",
  "/clients/[id]/activities": "Client Activities",
  "/clients/[id]/documents": "Client Documents",
  "/clients/[id]/notes": "Client Notes",
  "/opportunities": "Opportunities",
  "/activities": "Activities",
  "/clients": "Clients",
  "/proposals": "Proposals",
  "/pricingrequests": "Pricing Requests",
  "/reports": "Reports",
  "/admin": "Admin",
  "/sales": "Sales Workspace",
  "/sales/contracts/expiring": "Expiring Contracts",
};

const pageSubtitles: Record<string, string> = {
  "/dashboard": "Welcome back, here's your sales overview.",
  "/clients/[id]/overview": "Client-level overview and context.",
  "/clients/[id]/contacts": "Manage contacts for this client.",
  "/clients/[id]/opportunities": "Manage opportunities for this client.",
  "/clients/[id]/pricing-requests": "Manage pricing requests for this client.",
  "/clients/[id]/proposals": "Manage proposals for this client.",
  "/clients/[id]/contracts": "Manage contracts for this client.",
  "/clients/[id]/activities": "Manage activities for this client.",
  "/clients/[id]/documents": "Manage documents for this client.",
  "/clients/[id]/notes": "Manage notes for this client.",
  "/opportunities": "Track and progress your pipeline stages from lead to close.",
  "/activities": "Plan, assign, and complete sales follow-up activities.",
  "/clients": "Maintain your organisation's client directory and details.",
  "/proposals": "Create, submit, and manage proposal approvals.",
  "/pricingrequests": "Coordinate pricing requests and assignment workflow.",
  "/reports": "Review sales performance and pipeline reporting metrics.",
  "/admin": "Monitor organisation-wide activity and control center metrics.",
  "/sales": "Monitor your day-to-day sales execution workspace.",
  "/sales/contracts/expiring": "Review contracts nearing expiry and take renewal action.",
};

type NavItem = { href: string; label: string; icon: React.ReactNode };

export const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const { role, user, isAuthenticated } = useAuthState();
  const { logout } = useAuthActions();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const routeLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRouteLoading = useCallback(() => {
    setIsRouteLoading(true);
    if (routeLoadingTimeoutRef.current) clearTimeout(routeLoadingTimeoutRef.current);
    routeLoadingTimeoutRef.current = setTimeout(() => setIsRouteLoading(false), 10000);
  }, []);

  const activeRole = resolveUserRole(role, user?.roles);
  const isPublicPath = publicPaths.has(pathname);
  const clientWorkspaceMatch = pathname.match(/^\/clients\/([^/]+)(?:\/.*)?$/);
  const activeClientId = clientWorkspaceMatch?.[1];
  const isClientWorkspace = Boolean(activeClientId && pathname !== "/clients");

  const isMobile = !screens.md;
  const isTablet = !!screens.md && !screens.lg;
  const siderWidth = 252;
  const collapsedWidth = 80;
  const headerHeight = 64;
  const siderSpace = isMobile ? 0 : isTablet ? collapsedWidth : siderWidth;

  useEffect(() => {
    setIsRouteLoading(false);
    setMobileDrawerOpen(false);
    if (routeLoadingTimeoutRef.current) {
      clearTimeout(routeLoadingTimeoutRef.current);
      routeLoadingTimeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(
    () => () => {
      if (routeLoadingTimeoutRef.current) clearTimeout(routeLoadingTimeoutRef.current);
    },
    []
  );

  if (isPublicPath || !isAuthenticated) return <>{children}</>;

  const globalNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
    { href: "/clients", label: "Clients", icon: <TeamOutlined /> },
    { href: "/opportunities", label: "Opportunities", icon: <FundOutlined /> },
    { href: "/activities", label: "Activities", icon: <SolutionOutlined /> },
    ...(hasPermission(activeRole, Permission.viewReports)
      ? [{ href: "/reports", label: "Reports", icon: <BarChartOutlined /> }]
      : []),
    ...(hasPermission(activeRole, Permission.manageUsers) ||
    hasPermission(activeRole, Permission.manageSettings)
      ? [{ href: "/admin", label: "Admin", icon: <SettingOutlined /> }]
      : []),
  ];

  const clientNavItems: NavItem[] = activeClientId
    ? [
        { href: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
        { href: "/clients", label: "Clients", icon: <TeamOutlined /> },
        { href: `/clients/${activeClientId}/overview`, label: "Overview", icon: <DashboardOutlined /> },
        { href: `/clients/${activeClientId}/contacts`, label: "Contacts", icon: <ContactsOutlined /> },
        { href: `/clients/${activeClientId}/opportunities`, label: "Opportunities", icon: <FundOutlined /> },
        { href: `/clients/${activeClientId}/pricing-requests`, label: "Pricing", icon: <DollarOutlined /> },
        { href: `/clients/${activeClientId}/proposals`, label: "Proposals", icon: <FileTextOutlined /> },
        { href: `/clients/${activeClientId}/contracts`, label: "Contracts", icon: <FileDoneOutlined /> },
        { href: `/clients/${activeClientId}/activities`, label: "Activities", icon: <SolutionOutlined /> },
        { href: `/clients/${activeClientId}/documents`, label: "Documents", icon: <FolderOpenOutlined /> },
        { href: `/clients/${activeClientId}/notes`, label: "Notes", icon: <FileTextOutlined /> },
        ...(hasPermission(activeRole, Permission.viewReports)
          ? [{ href: "/reports", label: "Reports", icon: <BarChartOutlined /> }]
          : []),
        ...(hasPermission(activeRole, Permission.manageUsers) ||
        hasPermission(activeRole, Permission.manageSettings)
          ? [{ href: "/admin", label: "Admin", icon: <SettingOutlined /> }]
          : []),
      ]
    : [];

  const navItems = isClientWorkspace ? clientNavItems : globalNavItems;

  const resolveClientKey = (path: string) => {
    if (!isClientWorkspace) return path;
    const suffix =
      path.replace(/^\/clients\/[^/]+/, "/clients/[id]").replace(/\/$/, "") ||
      "/clients/[id]/overview";
    return suffix;
  };

  const activeLabel =
    pageTitles[resolveClientKey(pathname)] ??
    pageTitles[pathname] ??
    pageTitles[Object.keys(pageTitles).find((route) => pathname.startsWith(route)) ?? "/dashboard"] ??
    "Dashboard";
  const activeSubtitle =
    pageSubtitles[resolveClientKey(pathname)] ??
    pageSubtitles[pathname] ??
    pageSubtitles[Object.keys(pageSubtitles).find((route) => pathname.startsWith(route)) ?? "/dashboard"] ??
    "Welcome back.";

  const selectedNavKey =
    navItems
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "/dashboard";

  const menuItems: MenuProps["items"] = navItems.map((item) => ({
    key: item.href,
    icon: item.icon,
    label: item.label,
  }));

  const handleNavigate = (href: string) => {
    if (href === pathname) {
      setMobileDrawerOpen(false);
      return;
    }
    startRouteLoading();
    setMobileDrawerOpen(false);
    router.push(href);
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <div style={{ minWidth: 180 }}>
          <Typography.Text strong>{`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User"}</Typography.Text>
          <br />
          <Typography.Text type="secondary">{user?.email ?? "-"}</Typography.Text>
        </div>
      ),
      disabled: true,
      icon: <UserOutlined />,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
    },
  ];

  return (
    <Layout style={appShellStyles.root}>
      <Header style={{ ...appShellStyles.header, height: headerHeight }}>
        <div style={appShellStyles.headerLeft}>
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              style={appShellStyles.mobileMenuButton}
              aria-label="Open navigation menu"
            />
          ) : null}
          <div style={appShellStyles.headerBrand}>
            <Image src="/images/logo.png" alt="Fusion Sales logo" width={28} height={28} />
            <Typography.Text style={appShellStyles.headerBrandText}>Fusion Sales</Typography.Text>
          </div>
        </div>
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key !== "logout") return;
              startRouteLoading();
              logout();
              router.push("/login");
            },
          }}
          trigger={["click"]}
        >
          <Button type="text" style={appShellStyles.userButton} icon={<UserOutlined />}>
            {user?.firstName ?? "Profile"}
          </Button>
        </Dropdown>
      </Header>

      {!isMobile ? (
        <Sider
          width={siderWidth}
          collapsedWidth={collapsedWidth}
          collapsible
          trigger={null}
          collapsed={isTablet}
          style={{ ...appShellStyles.sider, top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedNavKey]}
            items={menuItems}
            onClick={({ key }) => handleNavigate(String(key))}
            style={appShellStyles.menu}
          />
          <div style={appShellStyles.siderFooter}>
            <Button
              block
              icon={<LogoutOutlined />}
              onClick={() => {
                startRouteLoading();
                logout();
                router.push("/login");
              }}
            >
              Logout
            </Button>
          </div>
        </Sider>
      ) : null}

      <Drawer
        title="Navigation"
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedNavKey]}
          items={menuItems}
          onClick={({ key }) => handleNavigate(String(key))}
          style={appShellStyles.mobileMenu}
        />
      </Drawer>

      <Content
        style={{
          ...appShellStyles.main,
          marginLeft: siderSpace,
          marginTop: headerHeight,
        }}
      >
        {isRouteLoading ? (
          <div style={{ ...appShellStyles.routeLoadingOverlay, left: siderSpace, top: headerHeight }}>
            <Spin size="large" tip="Loading..." />
          </div>
        ) : null}
        <div style={appShellStyles.headingWrap}>
          <div style={appShellStyles.headingTextWrap}>
            <Typography.Title level={1} style={appShellStyles.headingTitle}>
              {activeLabel}
            </Typography.Title>
            <Typography.Text style={appShellStyles.headingSubTitle}>{activeSubtitle}</Typography.Text>
          </div>
        </div>
        {children}
      </Content>
    </Layout>
  );
};

