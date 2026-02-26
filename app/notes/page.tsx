"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Space, Switch, Table, message } from "antd";
import type { TableProps } from "antd";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import { RelatedToTypeLabels, RelatedToTypeValue } from "@/constants/enums";

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editForm] = Form.useForm<NoteRow>();
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

  const openEdit = (record: NoteRow) => {
    setEditingNoteId(record.id);
    editForm.setFieldsValue({
      content: record.content,
      relatedToType: record.relatedToType,
      relatedToId: record.relatedToId,
      isPrivate: record.isPrivate,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editingNoteId) return;
    try {
      const values = await editForm.validateFields();
      await axios.put(`/api/Notes/${editingNoteId}`, {
        content: values.content,
        relatedToType: values.relatedToType,
        relatedToId: values.relatedToId,
        isPrivate: values.isPrivate,
      });
      message.success("Note updated");
      setIsEditOpen(false);
      setEditingNoteId(null);
      await load();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to update note"));
    }
  };

  const columns: TableProps<NoteRow>["columns"] = [
    { title: "Content", dataIndex: "content", key: "content" },
    {
      title: "Related Type",
      dataIndex: "relatedToType",
      key: "relatedToType",
      render: (value?: number) =>
        (RelatedToTypeLabels as Record<number, string>)[value ?? 0] ?? "-",
    },
    { title: "Private", dataIndex: "isPrivate", key: "isPrivate", render: (value?: boolean) => (value ? "Yes" : "No") },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => openEdit(record)}
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
      <Modal
        title="Edit Note"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditingNoteId(null);
        }}
        onOk={onEditSave}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: "Enter note content" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="relatedToType" label="Related Type">
            <Select
              allowClear
              options={Object.entries(RelatedToTypeLabels).map(([value, label]) => ({
                value: Number(value) as RelatedToTypeValue,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item name="relatedToId" label="Related ID">
            <Input />
          </Form.Item>
          <Form.Item name="isPrivate" label="Private" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
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

