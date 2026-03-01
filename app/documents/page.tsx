"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Form,
  Space,
  Table,
} from "antd";
import type { TableProps } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { usePermission } from "@/components/hooks/usePermission";
import { capabilityStyles } from "../capability.styles";
import { getErrorMessage } from "@/utils/requestError";
import {
  DocumentCategoryLabels,
  OpportunitySource,
  OpportunityStage,
  RelatedToType,
  RelatedToTypeLabels,
} from "@/constants/enums";
import type {
  DocumentRecommendation,
  DocumentRow,
  DocumentsModuleProps,
  LeadExecutionForm,
  RelatedClientOption,
  UploadDocumentForm,
} from "./documentTypes";
import {
  decodeFileNameFromHeader,
  fetchJsonWithTimeout,
  getResponseItems,
  isLikelyTextContent,
  sourceToEnum,
  splitName,
} from "./documentUtils";
import { RecommendationModal } from "@/components/documents/RecommendationModal";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";

const DocumentsContent = ({ clientId }: DocumentsModuleProps) => {
  const { message: appMessage } = App.useApp();
  const axios = getAxiosInstance();
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

  const { hasPermission, Permission } = usePermission();
  const canDelete = hasPermission(Permission.deleteDocument);
  const canCreateOpportunity = hasPermission(Permission.createOpportunity);

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
      appMessage.error(getErrorMessage(error, "Unable to load documents"));
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
      appMessage.success("Document deleted");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to delete document"));
    }
  };

  const openRecommendation = (record: DocumentRow) => {
    const recommendation = recommendationByDocumentId[record.id];
    if (!recommendation) {
      appMessage.info("Analyze the document first.");
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
        appMessage.warning(
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
      appMessage.success("AI recommendation ready");
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
      appMessage.error(explicitMessage ?? getErrorMessage(error, "Unable to analyze document"));
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
      appMessage.error("No recommendation loaded for this document.");
      return;
    }

    if (recommendation.recommendedAction !== "create_lead_opportunity") {
      appMessage.info("This recommendation does not propose a lead creation action.");
      return;
    }

    if (!canCreateOpportunity) {
      appMessage.error("You do not have permission to create opportunities.");
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
      appMessage.success("Lead opportunity created from AI recommendation");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) return;
      appMessage.error(getErrorMessage(error, "Unable to apply AI recommendation"));
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
                appMessage.success("Download started");
              } catch (error) {
                appMessage.error(getErrorMessage(error, "Unable to download document"));
              }
            }}
          >
            Download
          </Button>
          {canDelete ? (
            <Button
              size="small"
              danger
              onClick={() => onDelete(record.id)}
            >
              Delete
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const onUpload = async (values: UploadDocumentForm) => {
    try {
      if (!fileList[0]?.originFileObj) {
        appMessage.error("Select a file to upload.");
        return;
      }
      if (values.relatedToType !== undefined && !values.relatedToId) {
        appMessage.error("Select a related record.");
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
        appMessage.error("Select a related record.");
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
      appMessage.success("Document uploaded");
      setFileList([]);
      form.resetFields();
      await load();
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Unable to upload document"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={capabilityStyles.container}>
      <DocumentUploadForm
        clientId={clientId}
        form={form}
        fileList={fileList}
        uploading={uploading}
        relatedToTypeValue={relatedToTypeValue}
        relatedClients={relatedClients}
        relatedClientsLoading={relatedClientsLoading}
        onUpload={onUpload}
        onFileListChange={setFileList}
      />
      <Table<DocumentRow>
        rowKey="id"
        loading={isPending}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <RecommendationModal
        open={isRecommendationOpen}
        selectedDocument={selectedRecommendationDoc}
        recommendationByDocumentId={recommendationByDocumentId}
        executionForm={executionForm}
        applyingDocumentId={applyingDocumentId}
        onCancel={() => {
          setIsRecommendationOpen(false);
          setSelectedRecommendationDoc(null);
        }}
        onConfirm={applyRecommendation}
      />
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


