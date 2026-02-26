"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Space, Table, message } from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole } from "@/constants/roles";
import { hasPermission, Permission } from "@/constants/permissions";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";

interface DocumentRow {
  id: string;
  fileName?: string;
  category?: number;
  relatedToType?: number;
  createdAt?: string;
}

const DocumentsContent = () => {
  const axios = getAxiosInstance();
  const { role, user } = useAuthState();
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [isPending, setIsPending] = useState(false);
  const loadedRef = useRef(false);

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canDelete = hasPermission(activeRole, Permission.deleteDocument);

  const load = useCallback(async () => {
    setIsPending(true);
    try {
      const response = await axios.get("/api/Documents", {
        params: { pageNumber: 1, pageSize: 20 },
      });
      const data = response.data;
      setRows(data.items ?? data);
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to load documents"));
    } finally {
      setIsPending(false);
    }
  }, [axios]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const onDelete = async (id: string) => {
    try {
      await axios.delete(`/api/Documents/${id}`);
      await load();
      message.success("Document deleted");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to delete document"));
    }
  };

  const columns: TableProps<DocumentRow>["columns"] = [
    { title: "File", dataIndex: "fileName", key: "fileName" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Related Type", dataIndex: "relatedToType", key: "relatedToType" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={async () => {
              try {
                await axios.get(`/api/Documents/${record.id}/download`);
                message.success("Download request sent");
              } catch (error) {
                message.error(getErrorMessage(error, "Unable to download document"));
              }
            }}
          >
            Download
          </Button>
          <Button
            size="small"
            danger
            disabled={!canDelete}
            onClick={() => onDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={capabilityStyles.container}>
      <Table<DocumentRow>
        rowKey="id"
        loading={isPending}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default function DocumentsPage() {
  return (
    <AuthGuard>
      <DocumentsContent />
    </AuthGuard>
  );
}

