"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Space, Table, message } from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";

interface NoteRow {
  id: string;
  content: string;
  relatedToType?: number;
  relatedToId?: string;
  isPrivate?: boolean;
}

const NotesContent = () => {
  const axios = getAxiosInstance();
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [isPending, setIsPending] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setIsPending(true);
    try {
      const response = await axios.get("/api/Notes", {
        params: { pageNumber: 1, pageSize: 20 },
      });
      const data = response.data;
      setRows(data.items ?? data);
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to load notes"));
    } finally {
      setIsPending(false);
    }
  }, [axios]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  const columns: TableProps<NoteRow>["columns"] = [
    { title: "Content", dataIndex: "content", key: "content" },
    { title: "Related Type", dataIndex: "relatedToType", key: "relatedToType" },
    { title: "Private", dataIndex: "isPrivate", key: "isPrivate", render: (value?: boolean) => (value ? "Yes" : "No") },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={async () => {
              try {
                await axios.put(`/api/Notes/${record.id}`, {
                  content: record.content,
                  relatedToType: record.relatedToType,
                  relatedToId: record.relatedToId,
                  isPrivate: record.isPrivate,
                });
                message.success("Note updated");
              } catch (error) {
                message.error(getErrorMessage(error, "Unable to update note"));
              }
            }}
          >
            Update
          </Button>
          <Button
            size="small"
            danger
            onClick={async () => {
              try {
                await axios.delete(`/api/Notes/${record.id}`);
                await load();
                message.success("Note deleted");
              } catch (error) {
                message.error(getErrorMessage(error, "Unable to delete note"));
              }
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={capabilityStyles.container}>
      <Table<NoteRow>
        rowKey="id"
        loading={isPending}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default function NotesPage() {
  return (
    <AuthGuard>
      <NotesContent />
    </AuthGuard>
  );
}

