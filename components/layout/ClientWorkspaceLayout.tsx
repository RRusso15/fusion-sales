"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, Descriptions, Space, Tabs, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ClientTypeLabels } from "@/constants/enums";
import { useClientActions, useClientState } from "@/providers/clientProvider";
import { useContactActions, useContactState } from "@/providers/contactProvider";

interface ClientWorkspaceLayoutProps {
  clientId: string;
  children: React.ReactNode;
}

const workspaceTabs = [
  { key: "overview", label: "Overview" },
  { key: "contacts", label: "Contacts" },
  { key: "opportunities", label: "Opportunities" },
  { key: "pricing-requests", label: "Pricing Requests" },
  { key: "proposals", label: "Proposals" },
  { key: "contracts", label: "Contracts" },
  { key: "activities", label: "Activities" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
];

export const ClientWorkspaceLayout = ({
  clientId,
  children,
}: ClientWorkspaceLayoutProps) => {
  const pathname = usePathname();
  const loadedRef = useRef(false);
  const { selectedClient } = useClientState();
  const { contacts } = useContactState();
  const { fetchClientById } = useClientActions();
  const { fetchContactsByClient } = useContactActions();

  const loadContext = useCallback(async () => {
    await Promise.all([fetchClientById(clientId), fetchContactsByClient(clientId)]);
  }, [clientId, fetchClientById, fetchContactsByClient]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadContext().catch(() => undefined);
  }, [loadContext]);

  const primaryContact = useMemo(
    () =>
      contacts.find((contact) => contact.isPrimaryContact) ??
      contacts[0],
    [contacts]
  );

  const activeTab =
    workspaceTabs.find((tab) => pathname.endsWith(`/${tab.key}`))?.key ?? "overview";
  const revenue = (selectedClient as { revenue?: number | null } | undefined)?.revenue;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {selectedClient?.name ?? "Client Workspace"}
          </Typography.Title>
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Industry">
              {selectedClient?.industry ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Client Type">
              {selectedClient?.clientType
                ? ClientTypeLabels[selectedClient.clientType]
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Revenue">
              {typeof revenue === "number" ? revenue.toLocaleString() : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Primary Contact">
              {primaryContact
                ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Email">
              {primaryContact?.email ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          items={workspaceTabs.map((tab) => ({
            key: tab.key,
            label: (
              <Link href={`/clients/${clientId}/${tab.key}`}>{tab.label}</Link>
            ),
          }))}
        />
        {children}
      </Card>
    </Space>
  );
};
