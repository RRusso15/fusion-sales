"use client";

import Link from "next/link";
import { Button, Space } from "antd";
import { normalizeRole } from "@/constants/roles";
import { useAuthState } from "@/providers/authProvider";
import { hasPermission, Permission } from "@/constants/permissions";

export const CapabilityNav = () => {
  const { role, user } = useAuthState();
  const activeRole = role ?? normalizeRole(user?.roles?.[0]);

  return (
    <Space wrap>
      <Link href="/dashboard">
        <Button>Dashboard</Button>
      </Link>
      <Link href="/clients">
        <Button>Clients</Button>
      </Link>
      <Link href="/contacts">
        <Button>Contacts</Button>
      </Link>
      <Link href="/opportunities">
        <Button>Opportunities</Button>
      </Link>
      <Link href="/proposals">
        <Button>Proposals</Button>
      </Link>
      <Link href="/pricingrequests">
        <Button>Pricing</Button>
      </Link>
      <Link href="/contracts">
        <Button>Contracts</Button>
      </Link>
      <Link href="/activities">
        <Button>Activities</Button>
      </Link>
      <Link href="/documents">
        <Button>Documents</Button>
      </Link>
      <Link href="/notes">
        <Button>Notes</Button>
      </Link>
      {hasPermission(activeRole, Permission.viewReports) ? (
        <Link href="/reports">
          <Button>Reports</Button>
        </Link>
      ) : null}
      {hasPermission(activeRole, Permission.manageUsers) ? (
        <Link href="/admin/users">
          <Button>Admin Users</Button>
        </Link>
      ) : null}
      {hasPermission(activeRole, Permission.manageSettings) ? (
        <Link href="/admin/settings">
          <Button>Admin Settings</Button>
        </Link>
      ) : null}
    </Space>
  );
};
