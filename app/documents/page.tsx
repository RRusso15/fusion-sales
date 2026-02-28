"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Upload,
  message,
} from "antd";
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
  OpportunitySource,
  OpportunityStage,
  RelatedToType,
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

interface AIExtractedLeadFields {
  clientName?: string | null;
  industry?: string | null;
  website?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPosition?: string | null;
  opportunityTitle?: string | null;
  estimatedValue?: number | null;
  source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "RFP" | null;
}

interface DocumentRecommendation {
  documentType?: "lead" | "contract" | "invoice" | "proposal" | "report" | "other";
  recommendedAction?: "create_lead_opportunity" | "none";
  confidence?: number;
  reasoning?: string;
  extracted?: AIExtractedLeadFields;
}

interface LeadExecutionForm {
  clientName: string;
  industry?: string;
  website?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPosition?: string;
  opportunityTitle?: string;
  estimatedValue?: number;
  source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "RFP";
}

interface RelatedClientOption {
  id: string;
  name?: string | null;
}

interface DocumentsModuleProps {
  clientId?: string;
}

const sourceToEnum: Record<NonNullable<LeadExecutionForm["source"]>, number> = {
  Inbound: OpportunitySource.Inbound,
  Outbound: OpportunitySource.Outbound,
  Referral: OpportunitySource.Referral,
  Partner: OpportunitySource.Partner,
  RFP: OpportunitySource.Rfp,
};

const splitName = (value?: string) => {
  if (!value) return { firstName: "", lastName: "" };
  const trimmed = value.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
};

const getResponseItems = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "items" in value) {
    const withItems = value as { items?: unknown };
    if (Array.isArray(withItems.items)) return withItems.items as T[];
  }
  return [];
};

const isLikelyTextContent = (fileName: string, contentType?: string) => {
  if (contentType?.startsWith("text/")) return true;
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm")
  );
};

const decodeFileNameFromHeader = (
  contentDisposition: string | undefined,
  fallbackName: string
) => {
  const filenameFromHeader = contentDisposition?.match(
    /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i
  );
  return decodeURIComponent(filenameFromHeader?.[1] || filenameFromHeader?.[2] || fallbackName);
};

const fetchJsonWithTimeout = async <T,>(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 25000
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T;
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
};

const DocumentsContent = ({ clientId }: DocumentsModuleProps) => {
  const axios = getAxiosInstance();
  const { role, user } = useAuthState();
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<UploadDocumentForm>();
  const [executionForm] = Form.useForm<LeadExecutionForm>();
  const relatedToTypeValue = Form.useWatch("relatedToType", form);
  const loadedRef = useRef(false);
  const [relatedClients, setRelatedClients] = useState<RelatedClientOption[]>([]);
  const [relatedClientsLoading, setRelatedClientsLoading] = useState(false);
  const [recommendationByDocumentId, setRecommendationByDocumentId] = useState<
    Record<string, DocumentRecommendation>
  >({});
  const [selectedRecommendationDoc, setSelectedRecommendationDoc] = useState<DocumentRow | null>(null);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [analyzingDocumentId, setAnalyzingDocumentId] = useState<string | null>(null);
  const [applyingDocumentId, setApplyingDocumentId] = useState<string | null>(null);

  const activeRole = role ?? normalizeRole(user?.roles?.[0]);
  const canDelete = hasPermission(activeRole, Permission.deleteDocument);
  const canCreateOpportunity = hasPermission(activeRole, Permission.createOpportunity);

  const load = useCallback(async () => {
    setIsPending(true);
    try {
      const response = await axios.get("/api/Documents", {
        params: {
          pageNumber: 1,
          pageSize: 20,
          ...(clientId
            ? { relatedToType: RelatedToType.Client, relatedToId: clientId }
            : {}),
        },
      });
      const data = response.data;
      setRows(data.items ?? data);
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to load documents"));
    } finally {
      setIsPending(false);
    }
  }, [axios, clientId]);

  const loadRelatedClients = useCallback(async () => {
    setRelatedClientsLoading(true);
    try {
      const response = await axios.get("/api/Clients", {
        params: { pageNumber: 1, pageSize: 200, isActive: true },
      });
      setRelatedClients(getResponseItems<RelatedClientOption>(response.data));
    } catch {
      setRelatedClients([]);
    } finally {
      setRelatedClientsLoading(false);
    }
  }, [axios]);

  const downloadDocumentBlob = useCallback(
    async (record: DocumentRow) => {
      const response = await axios.get(`/api/Documents/${record.id}/download`, {
        responseType: "blob",
      });
      const contentDisposition = response.headers["content-disposition"] as string | undefined;
      const fallbackName = record.fileName || record.name || `document-${record.id}`;
      const fileName = decodeFileNameFromHeader(contentDisposition, fallbackName);
      const contentType = (response.headers["content-type"] as string | undefined) ?? "";
      return {
        blob: response.data as Blob,
        fileName,
        contentType,
      };
    },
    [axios]
  );

  const extractDocumentText = async (
    blob: Blob,
    fileName: string,
    contentType?: string
  ) => {
    if (isLikelyTextContent(fileName, contentType)) {
      const text = await blob.text();
      return text.replace(/\0/g, "").trim().slice(0, 12000);
    }

    const body = new FormData();
    body.append(
      "file",
      new File([blob], fileName, {
        type: contentType || "application/octet-stream",
      })
    );

    const { response, data } = await fetchJsonWithTimeout<{ text?: string }>(
      "/api/ai/extract-document-text",
      {
        method: "POST",
        body,
      },
      25000
    );

    if (!response.ok) {
      return "";
    }

    return (data.text ?? "").trim().slice(0, 12000);
  };

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (clientId) return;
    if (relatedToTypeValue !== 1) return;
    if (relatedClients.length > 0 || relatedClientsLoading) return;
    loadRelatedClients().catch(() => undefined);
  }, [clientId, relatedClients.length, relatedClientsLoading, relatedToTypeValue, loadRelatedClients]);

  const onDelete = async (id: string) => {
    try {
      await axios.delete(`/api/Documents/${id}`);
      await load();
      message.success("Document deleted");
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to delete document"));
    }
  };

  const openRecommendation = (record: DocumentRow) => {
    const recommendation = recommendationByDocumentId[record.id];
    if (!recommendation) {
      message.info("Analyze the document first.");
      return;
    }

    setSelectedRecommendationDoc(record);
    setIsRecommendationOpen(true);
    executionForm.setFieldsValue({
      clientName: recommendation.extracted?.clientName ?? "",
      industry: recommendation.extracted?.industry ?? "",
      website: recommendation.extracted?.website ?? "",
      contactFirstName: recommendation.extracted?.contactFirstName ?? "",
      contactLastName: recommendation.extracted?.contactLastName ?? "",
      contactEmail: recommendation.extracted?.contactEmail ?? "",
      contactPhone: recommendation.extracted?.contactPhone ?? "",
      contactPosition: recommendation.extracted?.contactPosition ?? "",
      opportunityTitle: recommendation.extracted?.opportunityTitle ?? "",
      estimatedValue: recommendation.extracted?.estimatedValue ?? undefined,
      source: recommendation.extracted?.source ?? undefined,
    });
  };

  const analyzeDocument = async (record: DocumentRow) => {
    try {
      setAnalyzingDocumentId(record.id);
      const { blob, fileName, contentType } = await downloadDocumentBlob(record);
      const text = await extractDocumentText(blob, fileName, contentType);

      if (!text) {
        message.warning(
          "Could not extract readable text from this file. Recommendation will use metadata only."
        );
      }

      const { response, data } = await fetchJsonWithTimeout<
        DocumentRecommendation & { message?: string }
      >(
        "/api/ai/document-recommendation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: record.id,
            fileName,
            category: record.documentCategory ?? record.category,
            documentText: text,
          }),
        },
        30000
      );
      if (!response.ok) {
        throw new Error(data.message || "AI recommendation failed");
      }
      const recommendation = data as DocumentRecommendation;

      setRecommendationByDocumentId((prev) => ({
        ...prev,
        [record.id]: recommendation,
      }));
      message.success("AI recommendation ready");
      setSelectedRecommendationDoc(record);
      setIsRecommendationOpen(true);
      executionForm.setFieldsValue({
        clientName: recommendation.extracted?.clientName ?? "",
        industry: recommendation.extracted?.industry ?? "",
        website: recommendation.extracted?.website ?? "",
        contactFirstName: recommendation.extracted?.contactFirstName ?? "",
        contactLastName: recommendation.extracted?.contactLastName ?? "",
        contactEmail: recommendation.extracted?.contactEmail ?? "",
        contactPhone: recommendation.extracted?.contactPhone ?? "",
        contactPosition: recommendation.extracted?.contactPosition ?? "",
        opportunityTitle: recommendation.extracted?.opportunityTitle ?? "",
        estimatedValue: recommendation.extracted?.estimatedValue ?? undefined,
        source: recommendation.extracted?.source ?? undefined,
      });
    } catch (error) {
      const explicitMessage =
        error instanceof Error && error.message ? error.message : undefined;
      message.error(explicitMessage ?? getErrorMessage(error, "Unable to analyze document"));
    } finally {
      setAnalyzingDocumentId(null);
    }
  };

  const resolveOrCreateClientId = async (values: LeadExecutionForm) => {
    const searchResponse = await axios.get("/api/Clients", {
      params: {
        pageNumber: 1,
        pageSize: 50,
        searchTerm: values.clientName,
      },
    });
    const existingClients = getResponseItems<{ id: string; name?: string | null }>(
      searchResponse.data
    );
    const exactMatch = existingClients.find(
      (client) =>
        (client.name ?? "").trim().toLowerCase() === values.clientName.trim().toLowerCase()
    );
    if (exactMatch?.id) {
      return exactMatch.id;
    }

    const createResponse = await axios.post("/api/Clients", {
      name: values.clientName,
      industry: values.industry,
      website: values.website,
    });

    const createdId = (createResponse.data as { id?: string } | undefined)?.id;
    if (createdId) {
      return createdId;
    }

    const retryResponse = await axios.get("/api/Clients", {
      params: {
        pageNumber: 1,
        pageSize: 50,
        searchTerm: values.clientName,
      },
    });
    const retryItems = getResponseItems<{ id: string; name?: string | null }>(
      retryResponse.data
    );
    const retryMatch = retryItems.find(
      (client) =>
        (client.name ?? "").trim().toLowerCase() === values.clientName.trim().toLowerCase()
    );
    if (!retryMatch?.id) {
      throw new Error("Client was created but could not be resolved.");
    }
    return retryMatch.id;
  };

  const resolveOrCreateContactId = async (clientId: string, values: LeadExecutionForm) => {
    const firstName =
      values.contactFirstName?.trim() || splitName(values.contactLastName).firstName;
    const lastName =
      values.contactLastName?.trim() || splitName(values.contactFirstName).lastName;
    const email = values.contactEmail?.trim();

    if (!firstName && !lastName && !email) {
      return undefined;
    }

    const existingResponse = await axios.get(`/api/Contacts/by-client/${clientId}`);
    const existingContacts = getResponseItems<{
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    }>(existingResponse.data);

    const matchedByEmail = email
      ? existingContacts.find(
          (contact) => (contact.email ?? "").trim().toLowerCase() === email.toLowerCase()
        )
      : undefined;
    if (matchedByEmail?.id) {
      return matchedByEmail.id;
    }

    const matchedByName = existingContacts.find((contact) => {
      const fullName = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`
        .trim()
        .toLowerCase();
      const targetName = `${firstName} ${lastName}`.trim().toLowerCase();
      return !!targetName && fullName === targetName;
    });
    if (matchedByName?.id) {
      return matchedByName.id;
    }

    const createResponse = await axios.post("/api/Contacts", {
      clientId,
      firstName: firstName || "Primary",
      lastName: lastName || "Contact",
      email: email || undefined,
      phoneNumber: values.contactPhone?.trim() || undefined,
      position: values.contactPosition?.trim() || undefined,
      isPrimaryContact: true,
    });

    const createdId = (createResponse.data as { id?: string } | undefined)?.id;
    if (createdId) {
      return createdId;
    }
    return undefined;
  };

  const applyRecommendation = async () => {
    if (!selectedRecommendationDoc) return;
    const recommendation = recommendationByDocumentId[selectedRecommendationDoc.id];

    if (!recommendation) {
      message.error("No recommendation loaded for this document.");
      return;
    }

    if (recommendation.recommendedAction !== "create_lead_opportunity") {
      message.info("This recommendation does not propose a lead creation action.");
      return;
    }

    if (!canCreateOpportunity) {
      message.error("You do not have permission to create opportunities.");
      return;
    }

    try {
      const values = await executionForm.validateFields();
      setApplyingDocumentId(selectedRecommendationDoc.id);

      const clientId = await resolveOrCreateClientId(values);
      const contactId = await resolveOrCreateContactId(clientId, values);

      await axios.post("/api/Opportunities", {
        title: values.opportunityTitle?.trim() || `${values.clientName} Lead`,
        clientId,
        contactId,
        estimatedValue: values.estimatedValue,
        stage: OpportunityStage.Lead,
        source: values.source ? sourceToEnum[values.source] : OpportunitySource.Inbound,
        description: `Created from document ${selectedRecommendationDoc.fileName || selectedRecommendationDoc.name || selectedRecommendationDoc.id}`,
      });

      setIsRecommendationOpen(false);
      await load();
      message.success("Lead opportunity created from AI recommendation");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      message.error(getErrorMessage(error, "Unable to apply AI recommendation"));
    } finally {
      setApplyingDocumentId(null);
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
            loading={analyzingDocumentId === record.id}
            onClick={() => analyzeDocument(record)}
          >
            Analyze
          </Button>
          <Button
            size="small"
            type={recommendationByDocumentId[record.id] ? "primary" : "default"}
            disabled={!recommendationByDocumentId[record.id]}
            onClick={() => openRecommendation(record)}
          >
            AI Suggestion
          </Button>
          <Button
            size="small"
            onClick={async () => {
              try {
                const { blob, fileName, contentType } = await downloadDocumentBlob(record);
                const fileBlob = new Blob([blob], {
                  type: contentType || "application/octet-stream",
                });
                const url = window.URL.createObjectURL(fileBlob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = fileName;
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
      if (values.relatedToType !== undefined && !values.relatedToId) {
        message.error("Select a related record.");
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileList[0].originFileObj as File);
      if (values.documentCategory !== undefined) {
        formData.append("documentCategory", String(values.documentCategory));
      }
      const effectiveRelatedToType =
        clientId ? RelatedToType.Client : values.relatedToType;
      const effectiveRelatedToId = clientId ? clientId : values.relatedToId;

      if (effectiveRelatedToType !== undefined && !effectiveRelatedToId) {
        message.error("Select a related record.");
        return;
      }

      if (effectiveRelatedToType !== undefined) {
        formData.append("relatedToType", String(effectiveRelatedToType));
        formData.append("relatedToId", effectiveRelatedToId as string);
      } else if (values.relatedToType !== undefined) {
        formData.append("relatedToType", String(values.relatedToType));
        formData.append("relatedToId", values.relatedToId as string);
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
                      label="Related ID"
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
                      {relatedToTypeValue === 1 ? (
                        <Select
                          showSearch
                          allowClear
                          loading={relatedClientsLoading}
                          optionFilterProp="label"
                          placeholder="Select client"
                          options={relatedClients.map((client) => ({
                            value: client.id,
                            label: `${client.name || "Unnamed Client"} (${client.id.slice(0, 8)})`,
                          }))}
                        />
                      ) : (
                        <Input
                          placeholder={
                            relatedToTypeValue !== undefined
                              ? "Enter related record ID"
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
      <Table<DocumentRow>
        rowKey="id"
        loading={isPending}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="AI Recommendation"
        open={isRecommendationOpen}
        onCancel={() => {
          setIsRecommendationOpen(false);
          setSelectedRecommendationDoc(null);
        }}
        onOk={applyRecommendation}
        okText="Approve & Run"
        okButtonProps={{
          loading: applyingDocumentId === selectedRecommendationDoc?.id,
          disabled:
            !selectedRecommendationDoc ||
            recommendationByDocumentId[selectedRecommendationDoc.id]?.recommendedAction !==
              "create_lead_opportunity",
        }}
      >
        {selectedRecommendationDoc ? (
          <>
            <Alert
              type={
                recommendationByDocumentId[selectedRecommendationDoc.id]?.recommendedAction ===
                "create_lead_opportunity"
                  ? "success"
                  : "info"
              }
              showIcon
              message={`Recommended action: ${
                recommendationByDocumentId[selectedRecommendationDoc.id]?.recommendedAction ===
                "create_lead_opportunity"
                  ? "Create Lead Opportunity"
                  : "No automatic action"
              }`}
              description={`Confidence: ${Math.round(
                (recommendationByDocumentId[selectedRecommendationDoc.id]?.confidence ?? 0) * 100
              )}% | Type: ${
                recommendationByDocumentId[selectedRecommendationDoc.id]?.documentType ?? "other"
              }${
                recommendationByDocumentId[selectedRecommendationDoc.id]?.reasoning
                  ? ` | ${recommendationByDocumentId[selectedRecommendationDoc.id]?.reasoning}`
                  : ""
              }`}
              style={{ marginBottom: 16 }}
            />
            <Form form={executionForm} layout="vertical">
              <Form.Item
                name="clientName"
                label="Client Name"
                rules={[{ required: true, message: "Client name is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="industry" label="Industry">
                <Input />
              </Form.Item>
              <Form.Item name="website" label="Website">
                <Input />
              </Form.Item>
              <Form.Item name="contactFirstName" label="Contact First Name">
                <Input />
              </Form.Item>
              <Form.Item name="contactLastName" label="Contact Last Name">
                <Input />
              </Form.Item>
              <Form.Item name="contactEmail" label="Contact Email">
                <Input />
              </Form.Item>
              <Form.Item name="contactPhone" label="Contact Phone">
                <Input />
              </Form.Item>
              <Form.Item name="contactPosition" label="Contact Position">
                <Input />
              </Form.Item>
              <Form.Item name="opportunityTitle" label="Opportunity Title">
                <Input />
              </Form.Item>
              <Form.Item name="estimatedValue" label="Estimated Value">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="source" label="Source">
                <Select
                  allowClear
                  options={[
                    { value: "Inbound", label: "Inbound" },
                    { value: "Outbound", label: "Outbound" },
                    { value: "Referral", label: "Referral" },
                    { value: "Partner", label: "Partner" },
                    { value: "RFP", label: "RFP" },
                  ]}
                />
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export function DocumentsModule({ clientId }: DocumentsModuleProps) {
  return (
    <AuthGuard>
      <DocumentsContent clientId={clientId} />
    </AuthGuard>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/clients");
  }, [router]);
  return null;
}

