import {
  BarChartOutlined,
  ContactsOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FundOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { hasPermission, Permission } from "@/constants/permissions";
import type { UserRole } from "@/providers/authProvider/context";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

export const publicPaths = new Set(["/login", "/register", "/unauthorized"]);

export const pageTitles: Record<string, string> = {
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

export const pageSubtitles: Record<string, string> = {
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

export const resolveClientKey = (path: string, isClientWorkspace: boolean) => {
  if (!isClientWorkspace) return path;
  const suffix =
    path.replace(/^\/clients\/[^/]+/, "/clients/[id]").replace(/\/$/, "") ||
    "/clients/[id]/overview";
  return suffix;
};

export const buildNavItems = (
  activeRole: UserRole | undefined,
  isClientWorkspace: boolean,
  activeClientId?: string
): NavItem[] => {
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

  if (!isClientWorkspace || !activeClientId) return globalNavItems;

  return [
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
  ];
};

