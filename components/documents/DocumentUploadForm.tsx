"use client";

import { Button, Collapse, Form, Input, Select, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { DocumentCategoryLabels, RelatedToType, RelatedToTypeLabels } from "@/constants/enums";
import type {
  RelatedClientOption,
  UploadDocumentForm,
} from "@/app/documents/documentTypes";

interface DocumentUploadFormProps {
  clientId?: string;
  form: FormInstance<UploadDocumentForm>;
  fileList: UploadFile[];
  uploading: boolean;
  relatedToTypeValue?: number;
  relatedClients: RelatedClientOption[];
  relatedClientsLoading: boolean;
  onUpload: (values: UploadDocumentForm) => Promise<void>;
  onFileListChange: (nextList: UploadFile[]) => void;
}

export const DocumentUploadForm = ({
  clientId,
  form,
  fileList,
  uploading,
  relatedToTypeValue,
  relatedClients,
  relatedClientsLoading,
  onUpload,
  onFileListChange,
}: DocumentUploadFormProps) => {
  return (
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
                  onChange={({ fileList: nextList }) => onFileListChange(nextList)}
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
              {!clientId ? (
                <>
                  <Form.Item name="relatedToType" label="Related Type">
                    <Select
                      allowClear
                      onChange={() => {
                        form.setFieldValue("relatedToId", undefined);
                      }}
                      options={Object.entries(RelatedToTypeLabels).map(([value, label]) => ({
                        value: Number(value),
                        label,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="relatedToId"
                    label="Related Record"
                    rules={[
                      {
                        validator: async (_, value) => {
                          const selectedType = form.getFieldValue("relatedToType");
                          if (selectedType !== undefined && !value) {
                            throw new Error("Select a related record");
                          }
                        },
                      },
                    ]}
                  >
                    {relatedToTypeValue === RelatedToType.Client ? (
                      <Select
                        showSearch
                        allowClear
                        loading={relatedClientsLoading}
                        optionFilterProp="label"
                        placeholder="Select client"
                        options={relatedClients.map((client) => ({
                          value: client.id,
                          label: `${client.name || "Unnamed Client"}`,
                        }))}
                      />
                    ) : (
                      <Input
                        placeholder={
                          relatedToTypeValue !== undefined
                            ? "Select related record"
                            : "Select Related Type first"
                        }
                      />
                    )}
                  </Form.Item>
                </>
              ) : null}
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
  );
};



