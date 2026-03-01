"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  App,
  Alert,
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import {
  ActivityTypeLabels,
  ClientTypeLabels,
  OpportunitySourceLabels,
  OpportunityStageLabels,
  PriorityLabels,
} from "@/constants/enums";
import type { SetupPlan } from "@/types/setupPlan";
import { extractSetupPlanRules } from "@/services/ai/ruleExtractor";
import { normalizeSetupPlan } from "@/services/ai/setupPlanUtils";
import {
  executeSetupPlan,
  type ExecutionResult,
} from "@/services/ai/executeSetupPlan";
import { useAuthState } from "@/providers/authProvider";
import { getErrorMessage } from "@/utils/requestError";
import { capabilityStyles } from "@/app/capability.styles";
import { PageTransition } from "@/components/ui/PageTransition";

interface AiSetupWizardProps {
  existingClientId?: string;
}

const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "SalesManager", label: "SalesManager" },
  { value: "BusinessDevelopmentManager", label: "BusinessDevelopmentManager" },
  { value: "SalesRep", label: "SalesRep" },
];

const pricingRoleOptions = [
  { value: "SalesManager", label: "SalesManager" },
  { value: "BusinessDevelopmentManager", label: "BusinessDevelopmentManager" },
];

const readFileText = async (file: File) => {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/ai/extract-document-text", {
    method: "POST",
    body,
  });
  const data = (await response.json().catch(() => ({}))) as { text?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Failed to read uploaded file.");
  }
  return (data.text ?? "").trim();
};

export const AiSetupWizard = ({ existingClientId }: AiSetupWizardProps) => {
  const { message: appMessage } = App.useApp();
  const { user } = useAuthState();
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceText, setSourceText] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draftPlan, setDraftPlan] = useState<SetupPlan>(normalizeSetupPlan({}));
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const steps = useMemo(
    () => [
      { title: "Input" },
      { title: "Draft Extract" },
      { title: "Enhance" },
      { title: "Review + Execute" },
    ],
    []
  );

  const effectiveText = async () => {
    if (sourceText.trim()) return sourceText.trim();
    const upload = fileList[0]?.originFileObj as File | undefined;
    if (!upload) return "";
    return await readFileText(upload);
  };

  const runExtract = async () => {
    setIsExtracting(true);
    setWarning(null);
    try {
      const text = await effectiveText();
      if (!text) {
        appMessage.error("Paste text or upload a document first.");
        return;
      }
      const extracted = extractSetupPlanRules(text);
      setDraftPlan(extracted);
      setCurrentStep(1);
      appMessage.success("Draft setup plan extracted.");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Extraction failed"));
    } finally {
      setIsExtracting(false);
    }
  };

  const runEnhance = async () => {
    setIsEnhancing(true);
    try {
      const text = await effectiveText();
      if (!text) {
        appMessage.error("Paste text or upload a document first.");
        return;
      }
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, draftPlan }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        plan?: SetupPlan;
        warning?: string;
      };
      const normalized = normalizeSetupPlan(data.plan ?? draftPlan);
      setDraftPlan(normalized);
      setWarning(data.warning ?? null);
      setCurrentStep(2);
      appMessage.success("AI enhancement complete.");
    } catch (error) {
      appMessage.error(getErrorMessage(error, "AI enhancement failed"));
    } finally {
      setIsEnhancing(false);
    }
  };

  const runExecute = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      if (!existingClientId && !draftPlan.client) {
        appMessage.error("Client details are required for new setup.");
        return;
      }
      const result = await executeSetupPlan(draftPlan, {
        existingClientId,
        currentUserId: user?.id,
        originalFile: (fileList[0]?.originFileObj as File | undefined) ?? null,
        rawText: sourceText || undefined,
      });
      setExecutionResult(result);
      if (result.success) {
        appMessage.success("Setup execution completed.");
      } else {
        appMessage.warning("Setup execution finished with issues.");
      }
    } catch (error) {
      appMessage.error(getErrorMessage(error, "Execution failed"));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <PageTransition>
    <div style={capabilityStyles.container} className="fade-in">
      <Card title="AI Setup Wizard" className="hover-lift">
        <Steps current={currentStep} items={steps} />
      </Card>

      {warning ? <Alert type="warning" showIcon title={warning} /> : null}

      <Card title="1. Input (Upload or Paste)" className="step-enter">
        <Space orientation="vertical" style={{ width: "100%" }} className="stagger-list">
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList: nextList }) => setFileList(nextList)}
          >
            <Button icon={<UploadOutlined />}>Upload Lead/RFP/Brief</Button>
          </Upload>
          <Input.TextArea
            rows={8}
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Paste document text here..."
          />
          <Space>
            <Button type="primary" onClick={runExtract} loading={isExtracting} className="press">
              Extract (Free)
            </Button>
            <Button onClick={runEnhance} loading={isEnhancing} disabled={!draftPlan} className="press">
              Enhance with AI
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="2-4. Review + Execute" className="step-enter">
        {isExecuting ? <Spin /> : null}
        <Space orientation="vertical" style={{ width: "100%" }} size={16}>
          <Divider>Client</Divider>
          {draftPlan.client ? (
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="Client name"
                value={draftPlan.client.name}
                onChange={(event) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    client: prev.client
                      ? { ...prev.client, name: event.target.value }
                      : prev.client,
                  }))
                }
              />
              <Input
                placeholder="Industry"
                value={draftPlan.client.industry}
                onChange={(event) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    client: prev.client
                      ? { ...prev.client, industry: event.target.value }
                      : prev.client,
                  }))
                }
              />
              <Select
                allowClear
                placeholder="Client Type"
                value={draftPlan.client.clientType}
                options={Object.entries(ClientTypeLabels).map(([value, label]) => ({
                  value: Number(value),
                  label,
                }))}
                onChange={(value) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    client: prev.client ? { ...prev.client, clientType: value } : prev.client,
                  }))
                }
              />
              <Input
                placeholder="Website"
                value={draftPlan.client.website}
                onChange={(event) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    client: prev.client
                      ? { ...prev.client, website: event.target.value }
                      : prev.client,
                  }))
                }
              />
            </Space>
          ) : (
            <Alert
              type="info"
              title={
                existingClientId
                  ? "Using existing client from route context."
                  : "No client extracted yet."
              }
            />
          )}

          <Divider>Contacts</Divider>
          <Space orientation="vertical" style={{ width: "100%" }}>
            {draftPlan.contacts.map((contact, index) => (
              <Card
                key={`${contact.email ?? "contact"}-${index}`}
                size="small"
                extra={
                  <Button
                    danger
                    size="small"
                    onClick={() =>
                      setDraftPlan((prev) => ({
                        ...prev,
                        contacts: prev.contacts.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </Button>
                }
              >
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Input
                    placeholder="First Name"
                    value={contact.firstName}
                    onChange={(event) =>
                      setDraftPlan((prev) => {
                        const contacts = [...prev.contacts];
                        contacts[index] = { ...contacts[index], firstName: event.target.value };
                        return { ...prev, contacts };
                      })
                    }
                  />
                  <Input
                    placeholder="Last Name"
                    value={contact.lastName}
                    onChange={(event) =>
                      setDraftPlan((prev) => {
                        const contacts = [...prev.contacts];
                        contacts[index] = { ...contacts[index], lastName: event.target.value };
                        return { ...prev, contacts };
                      })
                    }
                  />
                  <Input
                    placeholder="Email"
                    value={contact.email}
                    onChange={(event) =>
                      setDraftPlan((prev) => {
                        const contacts = [...prev.contacts];
                        contacts[index] = { ...contacts[index], email: event.target.value };
                        return { ...prev, contacts };
                      })
                    }
                  />
                </Space>
              </Card>
            ))}
            <Button
              onClick={() =>
                setDraftPlan((prev) => ({
                  ...prev,
                  contacts: [
                    ...prev.contacts,
                    { firstName: "Contact", lastName: "New", isPrimaryContact: false },
                  ],
                }))
              }
            >
              Add Contact
            </Button>
          </Space>

          <Divider>Opportunity</Divider>
          {draftPlan.opportunity ? (
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="Title"
                value={draftPlan.opportunity.title}
                onChange={(event) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    opportunity: prev.opportunity
                      ? { ...prev.opportunity, title: event.target.value }
                      : prev.opportunity,
                  }))
                }
              />
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Estimated value"
                value={draftPlan.opportunity.estimatedValue}
                onChange={(value) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    opportunity: prev.opportunity
                      ? { ...prev.opportunity, estimatedValue: value ?? undefined }
                      : prev.opportunity,
                  }))
                }
              />
              <Select
                allowClear
                placeholder="Stage"
                value={draftPlan.opportunity.stage}
                options={Object.entries(OpportunityStageLabels).map(([value, label]) => ({
                  value: Number(value),
                  label,
                }))}
                onChange={(value) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    opportunity: prev.opportunity ? { ...prev.opportunity, stage: value } : prev.opportunity,
                  }))
                }
              />
              <Select
                allowClear
                placeholder="Source"
                value={draftPlan.opportunity.source}
                options={Object.entries(OpportunitySourceLabels).map(([value, label]) => ({
                  value: Number(value),
                  label,
                }))}
                onChange={(value) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    opportunity: prev.opportunity ? { ...prev.opportunity, source: value } : prev.opportunity,
                  }))
                }
              />
            </Space>
          ) : (
            <Space>
              <Tag>No opportunity in draft.</Tag>
              <Button
                onClick={() =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    opportunity: {
                      title: "New Opportunity",
                      currency: "ZAR",
                      stage: 1,
                      probability: 30,
                    },
                  }))
                }
              >
                Add Opportunity
              </Button>
            </Space>
          )}

          <Divider>Activities</Divider>
          <Space orientation="vertical" style={{ width: "100%" }}>
            {draftPlan.activities.map((activity, index) => (
              <Card
                key={`${activity.subject}-${index}`}
                size="small"
                extra={
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      setDraftPlan((prev) => ({
                        ...prev,
                        activities: prev.activities.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </Button>
                }
              >
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Input
                    placeholder="Subject"
                    value={activity.subject}
                    onChange={(event) =>
                      setDraftPlan((prev) => {
                        const activities = [...prev.activities];
                        activities[index] = { ...activities[index], subject: event.target.value };
                        return { ...prev, activities };
                      })
                    }
                  />
                  <Select
                    placeholder="Type"
                    value={activity.type}
                    options={Object.entries(ActivityTypeLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                    onChange={(value) =>
                      setDraftPlan((prev) => {
                        const activities = [...prev.activities];
                        activities[index] = { ...activities[index], type: value };
                        return { ...prev, activities };
                      })
                    }
                  />
                  <Select
                    placeholder="Priority"
                    value={activity.priority}
                    options={Object.entries(PriorityLabels).map(([value, label]) => ({
                      value: Number(value),
                      label,
                    }))}
                    onChange={(value) =>
                      setDraftPlan((prev) => {
                        const activities = [...prev.activities];
                        activities[index] = { ...activities[index], priority: value };
                        return { ...prev, activities };
                      })
                    }
                  />
                  <Select
                    allowClear
                    placeholder="Assign Role Hint"
                    value={activity.assignToRoleHint ?? undefined}
                    options={roleOptions}
                    onChange={(value) =>
                      setDraftPlan((prev) => {
                        const activities = [...prev.activities];
                        activities[index] = { ...activities[index], assignToRoleHint: value ?? null };
                        return { ...prev, activities };
                      })
                    }
                  />
                </Space>
              </Card>
            ))}
            <Button
              onClick={() =>
                setDraftPlan((prev) => ({
                  ...prev,
                  activities: [
                    ...prev.activities,
                    { type: 4, subject: "Follow up task", priority: 2, assignToRoleHint: "SalesRep" },
                  ],
                }))
              }
            >
              Add Activity
            </Button>
          </Space>

          <Divider>Pricing Request</Divider>
          {draftPlan.pricingRequest ? (
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="Title"
                value={draftPlan.pricingRequest.title}
                onChange={(event) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    pricingRequest: prev.pricingRequest
                      ? { ...prev.pricingRequest, title: event.target.value }
                      : prev.pricingRequest,
                  }))
                }
              />
              <Select
                allowClear
                placeholder="Priority"
                value={draftPlan.pricingRequest.priority}
                options={Object.entries(PriorityLabels).map(([value, label]) => ({
                  value: Number(value),
                  label,
                }))}
                onChange={(value) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    pricingRequest: prev.pricingRequest
                      ? { ...prev.pricingRequest, priority: value }
                      : prev.pricingRequest,
                  }))
                }
              />
              <Select
                allowClear
                placeholder="Assign Role Hint"
                value={draftPlan.pricingRequest.assignToRoleHint ?? undefined}
                options={pricingRoleOptions}
                onChange={(value) =>
                  setDraftPlan((prev) => ({
                    ...prev,
                    pricingRequest: prev.pricingRequest
                      ? { ...prev.pricingRequest, assignToRoleHint: value ?? null }
                      : prev.pricingRequest,
                  }))
                }
              />
            </Space>
          ) : (
            <Button
              onClick={() =>
                setDraftPlan((prev) => ({
                  ...prev,
                  pricingRequest: {
                    title: "Pricing Request",
                    priority: 3,
                    assignToRoleHint: "SalesManager",
                  },
                }))
              }
            >
              Add Pricing Request
            </Button>
          )}

          <Divider>Notes</Divider>
          <Space orientation="vertical" style={{ width: "100%" }}>
            {draftPlan.notes.map((note, index) => (
              <Card
                key={`${note.relatedTo}-${index}`}
                size="small"
                extra={
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      setDraftPlan((prev) => ({
                        ...prev,
                        notes: prev.notes.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </Button>
                }
              >
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Input.TextArea
                    rows={3}
                    value={note.content}
                    onChange={(event) =>
                      setDraftPlan((prev) => {
                        const notes = [...prev.notes];
                        notes[index] = { ...notes[index], content: event.target.value };
                        return { ...prev, notes };
                      })
                    }
                  />
                  <Select
                    value={note.relatedTo}
                    options={[
                      { value: "Client", label: "Client" },
                      { value: "Opportunity", label: "Opportunity" },
                    ]}
                    onChange={(value) =>
                      setDraftPlan((prev) => {
                        const notes = [...prev.notes];
                        notes[index] = { ...notes[index], relatedTo: value };
                        return { ...prev, notes };
                      })
                    }
                  />
                </Space>
              </Card>
            ))}
            <Button
              onClick={() =>
                setDraftPlan((prev) => ({
                  ...prev,
                  notes: [...prev.notes, { content: "New note", relatedTo: "Client", isPrivate: false }],
                }))
              }
            >
              Add Note
            </Button>
          </Space>

          <Divider />
          <Space>
            <Button onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}>Back</Button>
            <Button onClick={() => setCurrentStep((step) => Math.min(3, step + 1))}>Next</Button>
            <Button type="primary" onClick={runExecute} loading={isExecuting} className="press">
              Execute Setup
            </Button>
          </Space>
        </Space>
      </Card>

      {executionResult ? (
        <Card title="Execution Summary" className="step-enter">
          <Space orientation="vertical" style={{ width: "100%" }} className="stagger-list">
            <Tag color={executionResult.success ? "green" : "orange"}>
              {executionResult.success ? "Completed" : "Completed with issues"}
            </Tag>
            {executionResult.steps.map((step) => (
              <Alert
                key={step.key}
                className={step.status === "success" ? "step-check" : ""}
                type={
                  step.status === "success"
                    ? "success"
                    : step.status === "failed"
                    ? "error"
                    : "info"
                }
                showIcon
                title={`${step.label}: ${step.message}`}
              />
            ))}
            {executionResult.warnings.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                title={executionResult.warnings.join(" | ")}
              />
            ) : null}
            {executionResult.links.length > 0 ? (
              <>
                <Typography.Text strong>Deep Links</Typography.Text>
                <Space wrap>
                  {executionResult.links.map((link) => (
                    <Link href={link.href} key={link.href}>
                      <Button size="small">{link.label}</Button>
                    </Link>
                  ))}
                </Space>
              </>
            ) : null}
          </Space>
        </Card>
      ) : null}
    </div>
    </PageTransition>
  );
};












