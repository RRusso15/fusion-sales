"use client";

import { Alert, Form, Input, InputNumber, Modal, Select } from "antd";
import type { FormInstance } from "antd";
import type {
  DocumentRecommendation,
  DocumentRow,
  LeadExecutionForm,
} from "@/app/documents/documentTypes";

interface RecommendationModalProps {
  open: boolean;
  selectedDocument: DocumentRow | null;
  recommendationByDocumentId: Record<string, DocumentRecommendation>;
  executionForm: FormInstance<LeadExecutionForm>;
  applyingDocumentId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const RecommendationModal = ({
  open,
  selectedDocument,
  recommendationByDocumentId,
  executionForm,
  applyingDocumentId,
  onCancel,
  onConfirm,
}: RecommendationModalProps) => {
  return (
    <Modal
      title="AI Recommendation"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Approve & Run"
      okButtonProps={{
        loading: applyingDocumentId === selectedDocument?.id,
        disabled:
          !selectedDocument ||
          recommendationByDocumentId[selectedDocument.id]?.recommendedAction !==
            "create_lead_opportunity",
      }}
    >
      {selectedDocument ? (
        <>
          <Alert
            type={
              recommendationByDocumentId[selectedDocument.id]?.recommendedAction ===
              "create_lead_opportunity"
                ? "success"
                : "info"
            }
            showIcon
            title={`Recommended action: ${
              recommendationByDocumentId[selectedDocument.id]?.recommendedAction ===
              "create_lead_opportunity"
                ? "Create Lead Opportunity"
                : "No automatic action"
            }`}
            description={`Confidence: ${Math.round(
              (recommendationByDocumentId[selectedDocument.id]?.confidence ?? 0) * 100
            )}% | Type: ${
              recommendationByDocumentId[selectedDocument.id]?.documentType ?? "other"
            }${
              recommendationByDocumentId[selectedDocument.id]?.reasoning
                ? ` | ${recommendationByDocumentId[selectedDocument.id]?.reasoning}`
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
  );
};

