"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Collapse, Form, Input, Select, Space, Table, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { useAuthState } from "@/providers/authProvider";
import { normalizeRole } from "@/constants/roles";
import { hasPermission, Permission } from "@/constants/permissions";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import {
  DocumentCategoryLabels,
  RelatedToTypeLabels,
  DocumentCategoryValue,
  RelatedToTypeValue,
} from "@/constants/enums";

interface DocumentRow {
  id: string;
  name?: string;
  fileName?: string;
  documentCategory?: number;
  category?: number;
  relatedToType?: number;
  relatedToId?: string;
  createdAt?: string;
}

interface UploadDocumentForm {
  documentCategory?: DocumentCategoryValue;
  relatedToType?: RelatedToTypeValue;
  relatedToId?: string;
  description?: string;
}

const DocumentsContent = () => {
  const axios = getAxiosInstance();
  const { role, user } = useAuthState();
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<UploadDocumentForm>();
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
    {
      title: "File",
      dataIndex: "fileName",
      key: "fileName",
      render: (value: string | undefined, record) => value || record.name || "-",
    },
    {
      title: "Category",
      dataIndex: "documentCategory",
      key: "documentCategory",
      render: (value?: number, record?: DocumentRow) => {
        const categoryValue = value ?? record?.category;
        return (DocumentCategoryLabels as Record<number, string>)[categoryValue ?? 0] ?? "-";
      },
    },
    {
      title: "Related Type",
      dataIndex: "relatedToType",
      key: "relatedToType",
      render: (value?: number) =>
        (RelatedToTypeLabels as Record<number, string>)[value ?? 0] ?? "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={async () => {
              try {
                const response = await axios.get(`/api/Documents/${record.id}/download`, {
                  responseType: "blob",
                });
                const contentDisposition = response.headers["content-disposition"] as string | undefined;
                const filenameFromHeader = contentDisposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
                const fallbackName = record.fileName || record.name || `document-${record.id}`;
                const filename = decodeURIComponent(
                  filenameFromHeader?.[1] || filenameFromHeader?.[2] || fallbackName
                );
                const blob = new Blob([response.data], {
                  type: response.headers["content-type"] || "application/octet-stream",
                });
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = filename;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                window.URL.revokeObjectURL(url);
                message.success("Download started");
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

  const onUpload = async (values: UploadDocumentForm) => {
    try {
      if (!fileList[0]?.originFileObj) {
        message.error("Select a file to upload.");
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileList[0].originFileObj as File);
      if (values.documentCategory !== undefined) {
        formData.append("documentCategory", String(values.documentCategory));
      }
      if (values.relatedToType !== undefined) {
        formData.append("relatedToType", String(values.relatedToType));
      }
      if (values.relatedToId) {
        formData.append("relatedToId", values.relatedToId);
      }
      if (values.description) {
        formData.append("description", values.description);
      }

      await axios.post("/api/Documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Document uploaded");
      setFileList([]);
      form.resetFields();
      await load();
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to upload document"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={capabilityStyles.container}>
      <Collapse
        items={[
          {
            key: "upload-document",
            label: "Upload Document",
            children: (
              <Form<UploadDocumentForm> form={form} layout="vertical" onFinish={onUpload}>
                <Form.Item label="File" required>
                  <Upload
                    beforeUpload={() => false}
                    fileList={fileList}
                    maxCount={1}
                    onChange={({ fileList: nextList }) => setFileList(nextList)}
                  >
                    <Button icon={<UploadOutlined />}>Select File</Button>
                  </Upload>
                </Form.Item>
                <Form.Item name="documentCategory" label="Category">
                  <Select
                    allowClear
                    options={Object.entries(DocumentCategoryLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="relatedToType" label="Related Type">
                  <Select
                    allowClear
                    options={Object.entries(RelatedToTypeLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="relatedToId" label="Related ID">
                  <Input />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={uploading}>
                  Upload Document
                </Button>
              </Form>
            ),
          },
        ]}
      />
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

