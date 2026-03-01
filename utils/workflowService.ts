"use client";

import { Modal } from "antd";
import type { IActivity } from "@/providers/activityProvider/context";
import type { IContract } from "@/providers/contractProvider/context";
import type { IOpportunity } from "@/providers/opportunityProvider/context";
import type { IPricingRequest } from "@/providers/pricingProvider/context";
import type { IProposal } from "@/providers/proposalProvider/context";
import {
  OpportunitySource,
  OpportunityStage,
  OpportunityStageValue,
  ProposalStatus,
  RelatedToType,
} from "@/constants/enums";
import { getAxiosInstance } from "@/utils/axiosInstance";

const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { items?: unknown[] }).items)
  ) {
    return (value as { items: T[] }).items;
  }
  return [];
};

const ensureConfirm = (title: string, content: string) =>
  new Promise<boolean>((resolve) => {
    Modal.confirm({
      title,
      content,
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });

export interface PricingProposalPrefill {
  pricingRequestId: string;
  opportunityId: string;
  clientId?: string;
  proposalTitle: string;
  proposalDescription: string;
  currency?: string;
}

export class WorkflowService {
  private axios = getAxiosInstance();

  async handleOpportunityStageChange(args: {
    opportunityId: string;
    newStage: OpportunityStageValue;
  }) {
    if (args.newStage !== OpportunityStage.ClosedWon) return;

    const opportunityResponse = await this.axios.get(
      `/api/Opportunities/${args.opportunityId}`
    );
    const opportunity = opportunityResponse.data as IOpportunity;
    if (!opportunity?.clientId) return;

    const contractsResponse = await this.axios.get("/api/Contracts", {
      params: { clientId: opportunity.clientId, pageNumber: 1, pageSize: 200 },
    });
    const contracts = asArray<IContract>(contractsResponse.data);
    const existing = contracts.some(
      (contract) => contract.opportunityId === args.opportunityId
    );
    if (existing) return;

    const confirmed = await ensureConfirm(
      "Generate Contract",
      "Opportunity marked as Closed Won. Generate contract now?"
    );
    if (!confirmed) return;

    const proposalsResponse = await this.axios.get("/api/Proposals", {
      params: {
        opportunityId: args.opportunityId,
        status: ProposalStatus.Approved,
        pageNumber: 1,
        pageSize: 20,
      },
    });
    const proposals = asArray<IProposal>(proposalsResponse.data);
    const approvedProposal = proposals[0];
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    await this.axios.post("/api/Contracts", {
      clientId: opportunity.clientId,
      opportunityId: opportunity.id,
      proposalId: approvedProposal?.id,
      title: `Contract - ${opportunity.title ?? "Opportunity"}`,
      contractValue: opportunity.estimatedValue ?? 0,
      currency: opportunity.currency ?? "USD",
      startDate: now.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      ownerId: opportunity.ownerId,
      renewalNoticePeriod: 90,
      autoRenew: false,
      terms: "",
    });
  }

  async handleProposalApproved(args: { proposalId: string }) {
    const proposalResponse = await this.axios.get(`/api/Proposals/${args.proposalId}`);
    const proposal = proposalResponse.data as IProposal;
    if (!proposal?.opportunityId) return;

    const confirmed = await ensureConfirm(
      "Update Opportunity Stage",
      "Proposal approved. Move linked opportunity to Negotiation?"
    );
    if (!confirmed) return;

    await this.axios.put(`/api/Opportunities/${proposal.opportunityId}/stage`, {
      stage: OpportunityStage.Negotiation,
      reason: "Moved to negotiation after proposal approval",
    });
  }

  async handlePricingCompleted(args: { pricingRequestId: string }) {
    const pricingResponse = await this.axios.get(
      `/api/PricingRequests/${args.pricingRequestId}`
    );
    const pricing = pricingResponse.data as IPricingRequest;
    if (!pricing?.opportunityId) return null;

    const opportunityResponse = await this.axios.get(
      `/api/Opportunities/${pricing.opportunityId}`
    );
    const opportunity = opportunityResponse.data as IOpportunity;

    return {
      pricingRequestId: pricing.id,
      opportunityId: pricing.opportunityId,
      clientId: pricing.clientId ?? opportunity.clientId,
      proposalTitle: `Proposal - ${opportunity.title ?? pricing.title ?? "Pricing"}`,
      proposalDescription: pricing.description
        ? `Generated from pricing request: ${pricing.description}`
        : `Generated from pricing request: ${pricing.title ?? pricing.id}`,
      currency: opportunity.currency ?? "USD",
    } satisfies PricingProposalPrefill;
  }

  async createProposalFromPricing(prefill: PricingProposalPrefill) {
    if (!prefill.opportunityId || !prefill.clientId) {
      throw new Error("Missing opportunity or client for proposal generation.");
    }
    await this.axios.post("/api/Proposals", {
      opportunityId: prefill.opportunityId,
      clientId: prefill.clientId,
      title: prefill.proposalTitle,
      description: prefill.proposalDescription,
      currency: prefill.currency ?? "USD",
    });
  }

  async handleContractExpiring(args: { daysUntilExpiry?: number }) {
    const response = await this.axios.get("/api/Contracts/expiring", {
      params: { daysUntilExpiry: args.daysUntilExpiry ?? 90 },
    });
    return asArray<IContract>(response.data);
  }

  async createRenewalOpportunity(contractId: string) {
    const contractResponse = await this.axios.get(`/api/Contracts/${contractId}`);
    const contract = contractResponse.data as IContract;
    if (!contract?.clientId) {
      throw new Error("Contract is missing client information.");
    }

    const opportunityResponse = await this.axios.post("/api/Opportunities", {
      title: `Renewal - ${contract.title ?? "Contract"}`,
      clientId: contract.clientId,
      estimatedValue: contract.contractValue ?? 0,
      ownerId: contract.ownerId,
      stage: OpportunityStage.Proposal,
      source: OpportunitySource.Referral,
      type: "Renewal",
      description: `Auto-generated renewal opportunity for contract ${contract.id}`,
    });

    const renewalOpportunityId =
      (opportunityResponse.data as { id?: string } | undefined)?.id;
    if (!renewalOpportunityId) {
      throw new Error("Opportunity created but ID was not returned.");
    }

    await this.axios.post(`/api/Contracts/${contractId}/renewals`, {
      renewalOpportunityId,
    });
  }

  async handleActivityCompleted(args: { activityId: string }) {
    const activityResponse = await this.axios.get(`/api/Activities/${args.activityId}`);
    const activity = activityResponse.data as IActivity;

    if (
      activity.relatedToType !== RelatedToType.Opportunity ||
      !activity.relatedToId
    ) {
      return;
    }

    const opportunityResponse = await this.axios.get(
      `/api/Opportunities/${activity.relatedToId}`
    );
    const opportunity = opportunityResponse.data as IOpportunity;
    const currentStage = opportunity.stage ?? OpportunityStage.Lead;
    if (currentStage >= OpportunityStage.ClosedWon) return;

    const nextStage = Math.min(
      currentStage + 1,
      OpportunityStage.Negotiation
    ) as OpportunityStageValue;
    const confirmed = await ensureConfirm(
      "Advance Opportunity Stage",
      "Activity completed for an opportunity. Move it to the next stage?"
    );
    if (!confirmed) return;

    await this.axios.put(`/api/Opportunities/${activity.relatedToId}/stage`, {
      stage: nextStage,
      reason: "Advanced after activity completion",
    });
  }
}

export const workflowService = new WorkflowService();
