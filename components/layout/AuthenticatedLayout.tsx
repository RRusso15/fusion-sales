"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { MenuProps } from "antd";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Drawer, Dropdown, Grid, Layout, Menu, Spin, Typography } from "antd";
import { appShellStyles } from "./appShell.styles";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { resolveUserRole } from "@/constants/roles";
import {
  buildNavItems,
  pageSubtitles,
  pageTitles,
  publicPaths,
  resolveClientKey,
} from "./navigation/navigationConfig";
import { useRouteLoading } from "@/hooks/useRouteLoading";

const { Header, Sider, Content } = Layout;

const usePageMeta = (pathname: string, isClientWorkspace: boolean) => {
  const routeKey = resolveClientKey(pathname, isClientWorkspace);
  const title =
    pageTitles[routeKey] ??
    pageTitles[pathname] ??
    pageTitles[Object.keys(pageTitles).find((route) => pathname.startsWith(route)) ?? "/dashboard"] ??
    "Dashboard";
  const subtitle =
    pageSubtitles[routeKey] ??
    pageSubtitles[pathname] ??
    pageSubtitles[Object.keys(pageSubtitles).find((route) => pathname.startsWith(route)) ?? "/dashboard"] ??
    "Welcome back.";
  return { title, subtitle };
};

export const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const { role, user, isAuthenticated } = useAuthState();
  const { logout } = useAuthActions();
  const { isRouteLoading, startRouteLoading, stopRouteLoading } = useRouteLoading();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
    stopRouteLoading();
    setMobileDrawerOpen(false);
  }, [pathname, stopRouteLoading]);

  const navItems = useMemo(
    () => buildNavItems(activeRole, isClientWorkspace, activeClientId),
    [activeRole, isClientWorkspace, activeClientId]
  );

  const selectedNavKey =
    navItems
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "/dashboard";

  const menuItems: MenuProps["items"] = navItems.map((item) => {
    const isClientScopedItem =
      isClientWorkspace && !!activeClientId && item.href.startsWith(`/clients/${activeClientId}/`);

    return {
      key: item.href,
      icon: item.icon,
      label: (
        <span style={isClientScopedItem ? { paddingLeft: 14, display: "inline-block" } : undefined}>
          {item.label}
        </span>
      ),
    };
  });

  const { title: activeLabel, subtitle: activeSubtitle } = usePageMeta(pathname, isClientWorkspace);

  if (isPublicPath || !isAuthenticated) return <>{children}</>;

  const handleNavigate = (href: string) => {
    if (href === pathname) {
      setMobileDrawerOpen(false);
      return;
    }
    startRouteLoading();
    setMobileDrawerOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    startRouteLoading();
    logout();
    router.push("/login");
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
            <Image src="/images/logo.png" alt="Fusion Sales logo" width={40} height={30} />
            <Typography.Text style={appShellStyles.headerBrandText}>Fusion Sales</Typography.Text>
          </div>
        </div>
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === "logout") handleLogout();
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
            <Button block icon={<LogoutOutlined />} onClick={handleLogout}>
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

