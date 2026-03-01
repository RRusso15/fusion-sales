"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@ant-design/icons";
import { Button, Layout, Spin, Typography } from "antd";
import { appShellStyles } from "./appShell.styles";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { hasPermission, Permission } from "@/constants/permissions";
import { resolveUserRole } from "@/constants/roles";

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

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, isAuthenticated } = useAuthState();
  const { logout } = useAuthActions();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRouteLoading = useCallback(() => {
    setIsRouteLoading(true);
    if (routeLoadingTimeoutRef.current) {
      clearTimeout(routeLoadingTimeoutRef.current);
    }
    routeLoadingTimeoutRef.current = setTimeout(() => {
      setIsRouteLoading(false);
    }, 10000);
  }, []);

  const activeRole = resolveUserRole(role, user?.roles);
  const isPublicPath = publicPaths.has(pathname);
  const clientWorkspaceMatch = pathname.match(/^\/clients\/([^/]+)(?:\/.*)?$/);
  const activeClientId = clientWorkspaceMatch?.[1];
  const isClientWorkspace = Boolean(activeClientId && pathname !== "/clients");

  useEffect(() => {
    setIsRouteLoading(false);
    if (routeLoadingTimeoutRef.current) {
      clearTimeout(routeLoadingTimeoutRef.current);
      routeLoadingTimeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return;

      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = `${targetUrl.pathname}${targetUrl.search}`;
      if (nextPath === currentPath) return;

      startRouteLoading();
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [startRouteLoading]);

  useEffect(
    () => () => {
      if (routeLoadingTimeoutRef.current) {
        clearTimeout(routeLoadingTimeoutRef.current);
      }
    },
    []
  );

  if (isPublicPath || !isAuthenticated) {
    return <>{children}</>;
  }

  const globalNavItems = [
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

  const clientNavItems = activeClientId
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
      path
        .replace(/^\/clients\/[^/]+/, "/clients/[id]")
        .replace(/\/$/, "") || "/clients/[id]/overview";
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
            const isClientScopedItem =
              isClientWorkspace &&
              item.href.startsWith(`/clients/${activeClientId}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-item${isActive ? " app-nav-item-active" : ""}`}
                style={{
                  ...appShellStyles.navItem,
                  ...(isClientScopedItem ? { paddingLeft: 28 } : {}),
                  ...(isActive ? appShellStyles.navItemActive : {}),
                }}
              >
                <span className="app-nav-icon">{item.icon}</span>
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
              startRouteLoading();
              logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </aside>

      <Layout.Content style={appShellStyles.main}>
        {isRouteLoading ? (
          <div style={appShellStyles.routeLoadingOverlay}>
            <Spin size="large" tip="Loading..." />
          </div>
        ) : null}
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
