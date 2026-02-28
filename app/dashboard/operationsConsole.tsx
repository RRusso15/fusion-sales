"use client";

import { Button, Card, Collapse, Form, Input, InputNumber, Select, Switch, message } from "antd";
import { usePermission } from "@/components/hooks/usePermission";
import { getErrorMessage } from "@/utils/requestError";
import { useClientActions } from "@/providers/clientProvider";
import { useContactActions } from "@/providers/contactProvider";
import { useOpportunityActions } from "@/providers/opportunityProvider";
import { usePricingActions } from "@/providers/pricingProvider";
import { useProposalActions } from "@/providers/proposalProvider";
import { useContractActions } from "@/providers/contractProvider";
import { useActivityActions } from "@/providers/activityProvider";
import { type OpportunityStageValue } from "@/constants/enums";

const pickDefined = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== "")
  ) as Partial<T>;

export const OperationsConsole = () => {
  const { hasPermission: can, Permission } = usePermission();
  const client = useClientActions();
  const contact = useContactActions();
  const opportunity = useOpportunityActions();
  const pricing = usePricingActions();
  const proposal = useProposalActions();
  const contract = useContractActions();
  const activity = useActivityActions();

  const safeRun = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      message.success(ok);
    } catch (error) {
      message.error(getErrorMessage(error, "Operation failed"));
    }
  };

  return (
    <Card title="Operational Actions">
      <Collapse
        items={[
          {
            key: "client",
            label: "Client CRUD",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.createName) {
                      await client.createClient(
                        pickDefined({
                          name: v.createName,
                          industry: v.createIndustry,
                          clientType: v.createType,
                          website: v.createWebsite,
                        })
                      );
                    }
                    if (v.updateId) {
                      await client.updateClient(
                        v.updateId,
                        pickDefined({
                          name: v.updateName,
                          industry: v.updateIndustry,
                          clientType: v.updateType,
                        })
                      );
                    }
                    if (v.deleteId) await client.deleteClient(v.deleteId);
                  }, "Client action(s) completed")
                }
              >
                <Form.Item name="createName" label="Create: Name"><Input /></Form.Item>
                <Form.Item name="createIndustry" label="Create: Industry"><Input /></Form.Item>
                <Form.Item name="createType" label="Create: Type">
                  <Select options={[1, 2, 3].map((n) => ({ value: n, label: `${n}` }))} />
                </Form.Item>
                <Form.Item name="createWebsite" label="Create: Website"><Input /></Form.Item>
                <Form.Item name="updateId" label="Update: Client ID"><Input /></Form.Item>
                <Form.Item name="updateName" label="Update: Name"><Input /></Form.Item>
                <Form.Item name="updateIndustry" label="Update: Industry"><Input /></Form.Item>
                <Form.Item name="updateType" label="Update: Type">
                  <Select options={[1, 2, 3].map((n) => ({ value: n, label: `${n}` }))} />
                </Form.Item>
                <Form.Item name="deleteId" label="Delete: Client ID">
                  <Input disabled={!can(Permission.deleteClient)} />
                </Form.Item>
                <Button htmlType="submit" type="primary">Run Client</Button>
              </Form>
            ),
          },
          {
            key: "contact",
            label: "Contact CRUD",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.clientId && v.firstName && v.lastName) {
                      await contact.createContact(
                        pickDefined({
                          clientId: v.clientId,
                          firstName: v.firstName,
                          lastName: v.lastName,
                          email: v.email,
                          phoneNumber: v.phone,
                          isPrimaryContact: v.primary,
                        })
                      );
                    }
                    if (v.updateId) {
                      await contact.updateContact(v.updateId, pickDefined({ email: v.updateEmail, phoneNumber: v.updatePhone }));
                    }
                    if (v.primaryId) await contact.setPrimaryContact(v.primaryId);
                    if (v.deleteId) await contact.deleteContact(v.deleteId);
                  }, "Contact action(s) completed")
                }
              >
                <Form.Item name="clientId" label="Create: Client ID"><Input /></Form.Item>
                <Form.Item name="firstName" label="Create: First Name"><Input /></Form.Item>
                <Form.Item name="lastName" label="Create: Last Name"><Input /></Form.Item>
                <Form.Item name="email" label="Create: Email"><Input /></Form.Item>
                <Form.Item name="phone" label="Create: Phone"><Input /></Form.Item>
                <Form.Item name="primary" label="Create: Is Primary" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="updateId" label="Update: Contact ID"><Input /></Form.Item>
                <Form.Item name="updateEmail" label="Update: Email"><Input /></Form.Item>
                <Form.Item name="updatePhone" label="Update: Phone"><Input /></Form.Item>
                <Form.Item name="primaryId" label="Set Primary: Contact ID"><Input /></Form.Item>
                <Form.Item name="deleteId" label="Delete: Contact ID">
                  <Input disabled={!can(Permission.deleteContact)} />
                </Form.Item>
                <Button htmlType="submit" type="primary">Run Contact</Button>
              </Form>
            ),
          },
          {
            key: "opportunity",
            label: "Opportunity CRUD & Stage",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.title && v.clientId) {
                      await opportunity.createOpportunity(
                        pickDefined({
                          title: v.title,
                          clientId: v.clientId,
                          estimatedValue: v.value,
                          stage: v.stage,
                          source: v.source,
                        })
                      );
                    }
                    if (v.updateId) await opportunity.updateOpportunity(v.updateId, pickDefined({ title: v.updateTitle, estimatedValue: v.updateValue }));
                    if (v.stageId && v.stageTo) await opportunity.moveStage(v.stageId, v.stageTo as OpportunityStageValue, v.reason);
                    if (v.assignId && v.assignUserId) await opportunity.assignOpportunity(v.assignId, v.assignUserId);
                    if (v.deleteId) await opportunity.deleteOpportunity(v.deleteId);
                  }, "Opportunity action(s) completed")
                }
              >
                <Form.Item name="title" label="Create: Title"><Input /></Form.Item>
                <Form.Item name="clientId" label="Create: Client ID"><Input /></Form.Item>
                <Form.Item name="value" label="Create: Value"><InputNumber style={{ width: "100%" }} /></Form.Item>
                <Form.Item name="stage" label="Create: Stage"><Select options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}` }))} /></Form.Item>
                <Form.Item name="source" label="Create: Source"><Select options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}` }))} /></Form.Item>
                <Form.Item name="updateId" label="Update: Opportunity ID"><Input /></Form.Item>
                <Form.Item name="updateTitle" label="Update: Title"><Input /></Form.Item>
                <Form.Item name="updateValue" label="Update: Value"><InputNumber style={{ width: "100%" }} /></Form.Item>
                <Form.Item name="stageId" label="Move Stage: Opportunity ID"><Input /></Form.Item>
                <Form.Item name="stageTo" label="Move Stage: To"><Select options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}` }))} /></Form.Item>
                <Form.Item name="reason" label="Move Stage: Reason"><Input /></Form.Item>
                <Form.Item name="assignId" label="Assign: Opportunity ID"><Input disabled={!can(Permission.assignOpportunity)} /></Form.Item>
                <Form.Item name="assignUserId" label="Assign: User ID"><Input disabled={!can(Permission.assignOpportunity)} /></Form.Item>
                <Form.Item name="deleteId" label="Delete: Opportunity ID"><Input disabled={!can(Permission.deleteClient)} /></Form.Item>
                <Button htmlType="submit" type="primary">Run Opportunity</Button>
              </Form>
            ),
          },
          {
            key: "pricing",
            label: "Pricing Requests",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.title && v.clientId && v.requestedById) {
                      await pricing.createPricingRequest(
                        pickDefined({
                          title: v.title,
                          clientId: v.clientId,
                          requestedById: v.requestedById,
                          priority: v.priority,
                        })
                      );
                    }
                    if (v.assignId && v.assignUserId) await pricing.assignPricingRequest(v.assignId, v.assignUserId);
                    if (v.completeId) await pricing.completePricingRequest(v.completeId);
                  }, "Pricing action(s) completed")
                }
              >
                <Form.Item name="title" label="Create: Title"><Input /></Form.Item>
                <Form.Item name="clientId" label="Create: Client ID"><Input /></Form.Item>
                <Form.Item name="requestedById" label="Create: Requested By ID"><Input /></Form.Item>
                <Form.Item name="priority" label="Create: Priority"><Select options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}` }))} /></Form.Item>
                <Form.Item name="assignId" label="Assign: Pricing ID"><Input disabled={!can(Permission.assignPricingRequest)} /></Form.Item>
                <Form.Item name="assignUserId" label="Assign: User ID"><Input disabled={!can(Permission.assignPricingRequest)} /></Form.Item>
                <Form.Item name="completeId" label="Complete: Pricing ID"><Input /></Form.Item>
                <Button htmlType="submit" type="primary">Run Pricing</Button>
              </Form>
            ),
          },
          {
            key: "proposal",
            label: "Proposal Lifecycle",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.opportunityId && v.clientId && v.title) {
                      await proposal.createProposal(pickDefined({ opportunityId: v.opportunityId, clientId: v.clientId, title: v.title }));
                    }
                    if (v.submitId) await proposal.submitProposal(v.submitId);
                    if (v.approveId) await proposal.approveProposal(v.approveId);
                    if (v.rejectId) await proposal.rejectProposal(v.rejectId, v.rejectReason ?? "Rejected");
                  }, "Proposal action(s) completed")
                }
              >
                <Form.Item name="opportunityId" label="Create: Opportunity ID"><Input /></Form.Item>
                <Form.Item name="clientId" label="Create: Client ID"><Input /></Form.Item>
                <Form.Item name="title" label="Create: Title"><Input /></Form.Item>
                <Form.Item name="submitId" label="Submit: Proposal ID"><Input /></Form.Item>
                <Form.Item name="approveId" label="Approve: Proposal ID"><Input disabled={!can(Permission.approveProposal)} /></Form.Item>
                <Form.Item name="rejectId" label="Reject: Proposal ID"><Input disabled={!can(Permission.rejectProposal)} /></Form.Item>
                <Form.Item name="rejectReason" label="Reject: Reason"><Input /></Form.Item>
                <Button htmlType="submit" type="primary">Run Proposal</Button>
              </Form>
            ),
          },
          {
            key: "contract",
            label: "Contract Lifecycle",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.clientId && v.title && v.value !== undefined && v.startDate && v.endDate) {
                      await contract.createContract(
                        pickDefined({
                          clientId: v.clientId,
                          title: v.title,
                          contractValue: v.value,
                          startDate: v.startDate,
                          endDate: v.endDate,
                        })
                      );
                    }
                    if (v.activateId) await contract.activateContract(v.activateId);
                    if (v.cancelId) await contract.cancelContract(v.cancelId);
                    if (v.renewalContractId && v.renewalStart && v.renewalEnd && v.renewalValue !== undefined) {
                      await contract.createRenewal(v.renewalContractId, {
                        proposedStartDate: v.renewalStart,
                        proposedEndDate: v.renewalEnd,
                        proposedValue: v.renewalValue,
                      });
                    }
                    if (v.renewalCompleteId) await contract.completeRenewal(v.renewalCompleteId);
                  }, "Contract action(s) completed")
                }
              >
                <Form.Item name="clientId" label="Create: Client ID"><Input /></Form.Item>
                <Form.Item name="title" label="Create: Title"><Input /></Form.Item>
                <Form.Item name="value" label="Create: Contract Value"><InputNumber style={{ width: "100%" }} /></Form.Item>
                <Form.Item name="startDate" label="Create: Start Date (YYYY-MM-DD)"><Input /></Form.Item>
                <Form.Item name="endDate" label="Create: End Date (YYYY-MM-DD)"><Input /></Form.Item>
                <Form.Item name="activateId" label="Activate: Contract ID"><Input disabled={!can(Permission.activateContract)} /></Form.Item>
                <Form.Item name="cancelId" label="Cancel: Contract ID"><Input disabled={!can(Permission.cancelContract)} /></Form.Item>
                <Form.Item name="renewalContractId" label="Renewal: Contract ID"><Input /></Form.Item>
                <Form.Item name="renewalStart" label="Renewal: Start Date"><Input /></Form.Item>
                <Form.Item name="renewalEnd" label="Renewal: End Date"><Input /></Form.Item>
                <Form.Item name="renewalValue" label="Renewal: Value"><InputNumber style={{ width: "100%" }} /></Form.Item>
                <Form.Item name="renewalCompleteId" label="Renewal: Complete ID"><Input /></Form.Item>
                <Button htmlType="submit" type="primary">Run Contract</Button>
              </Form>
            ),
          },
          {
            key: "activity",
            label: "Activity CRUD",
            children: (
              <Form
                layout="vertical"
                onFinish={(v) =>
                  safeRun(async () => {
                    if (v.type && v.subject) {
                      await activity.createActivity(
                        pickDefined({
                          type: v.type,
                          subject: v.subject,
                          priority: v.priority,
                          dueDate: v.dueDate,
                        })
                      );
                    }
                    if (v.completeId) await activity.completeActivity(v.completeId, v.outcome ?? "Completed");
                    if (v.deleteId) await activity.deleteActivity(v.deleteId);
                  }, "Activity action(s) completed")
                }
              >
                <Form.Item name="type" label="Create: Type"><Select options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}` }))} /></Form.Item>
                <Form.Item name="subject" label="Create: Subject"><Input /></Form.Item>
                <Form.Item name="priority" label="Create: Priority"><Select options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}` }))} /></Form.Item>
                <Form.Item name="dueDate" label="Create: Due Date (ISO)"><Input /></Form.Item>
                <Form.Item name="completeId" label="Complete: Activity ID"><Input /></Form.Item>
                <Form.Item name="outcome" label="Complete: Outcome"><Input /></Form.Item>
                <Form.Item name="deleteId" label="Delete: Activity ID"><Input disabled={!can(Permission.deleteActivity)} /></Form.Item>
                <Button htmlType="submit" type="primary">Run Activity</Button>
              </Form>
            ),
          },
        ]}
      />
    </Card>
  );
};
