"use client";

import autoTable from "jspdf-autotable";
import type { jsPDF } from "jspdf";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { getAuthCookie } from "@/utils/cookie";
import {
  OpportunityStageLabels,
  ProposalStatusLabels,
} from "@/constants/enums";
import {
  applyPdfFooters,
  applyPdfLayoutToPage,
  createPdfDocument,
  type PdfLayoutOptions,
} from "@/components/pdf/PdfLayout";

type UnknownRecord = Record<string, unknown>;

const sanitizeFilePart = (value?: string | null) =>
  (value ?? "Document").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");

const toDateStamp = (date = new Date()) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asItems = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
};

let logoDataUrlPromise: Promise<string | undefined> | null = null;
const getLogoDataUrl = async () => {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = (async () => {
      try {
        const response = await fetch("/images/logo.png");
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      } catch {
        return undefined;
      }
    })();
  }
  return logoDataUrlPromise;
};

const parseTokenPayload = () => {
  const token = getAuthCookie();
  if (!token) return null;
  try {
    const base64Payload = token.split(".")[1];
    const normalizedPayload = base64Payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
    return JSON.parse(atob(normalizedPayload)) as UnknownRecord;
  } catch {
    return null;
  }
};

const resolveContext = async () => {
  const axios = getAxiosInstance();
  let generatedBy = "Unknown User";
  let tenantId = "";
  try {
    const response = await axios.get("/api/auth/me");
    const me = (response.data?.user ?? response.data) as UnknownRecord;
    const firstName = typeof me.firstName === "string" ? me.firstName : "";
    const lastName = typeof me.lastName === "string" ? me.lastName : "";
    generatedBy =
      `${firstName} ${lastName}`.trim() ||
      (typeof me.email === "string" ? me.email : "Unknown User");
    tenantId = typeof me.tenantId === "string" ? me.tenantId : "";
  } catch {
    const tokenPayload = parseTokenPayload();
    generatedBy =
      (typeof tokenPayload?.email === "string" ? tokenPayload.email : undefined) ??
      "Unknown User";
    tenantId =
      (typeof tokenPayload?.tenantId === "string" ? tokenPayload.tenantId : undefined) ??
      (typeof tokenPayload?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/tenantid"
      ] === "string"
        ? String(
            tokenPayload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/tenantid"
            ]
          )
        : "");
  }

  return {
    generatedBy,
    tenantId,
    generatedAt: new Date().toLocaleString(),
  };
};

const savePdf = (
  doc: jsPDF,
  entityType: string,
  title: string,
  layout: PdfLayoutOptions
) => {
  applyPdfFooters(doc, layout);
  doc.save(`${entityType}-${sanitizeFilePart(title)}-${toDateStamp()}.pdf`);
};

const addSectionTitle = (doc: jsPDF, text: string, y: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text(text, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
};

const createLayout = async (documentType: string): Promise<PdfLayoutOptions> => {
  const [logoDataUrl, context] = await Promise.all([getLogoDataUrl(), resolveContext()]);
  return {
    header: { documentType, logoDataUrl },
    footer: context,
  };
};

class PdfService {
  private axios = getAxiosInstance();

  async generateProposalPdf(id: string) {
    const layout = await createLayout("Proposal Document");
    const response = await this.axios.get(`/api/Proposals/${id}`);
    const proposal = response.data as UnknownRecord;

    const doc = createPdfDocument();
    let cursorY = applyPdfLayoutToPage(doc, layout);
    const proposalTitle = String(proposal.title ?? `Proposal-${id}`);
    const totals =
      toNumber(proposal.grandTotal) ||
      toNumber(proposal.totalAmount) ||
      toNumber(proposal.subtotal);

    doc.setFontSize(11);
    doc.text(`Proposal Title: ${proposalTitle}`, 14, cursorY);
    cursorY += 7;
    doc.text(`Client: ${String(proposal.clientName ?? proposal.clientId ?? "-")}`, 14, cursorY);
    cursorY += 7;
    doc.text(`Opportunity: ${String(proposal.opportunityId ?? "-")}`, 14, cursorY);
    cursorY += 7;
    doc.text(`Valid Until: ${formatDate(proposal.validUntil as string | undefined)}`, 14, cursorY);
    cursorY += 7;
    doc.text(
      `Status: ${
        ProposalStatusLabels[toNumber(proposal.status) as keyof typeof ProposalStatusLabels] ?? "-"
      }`,
      14,
      cursorY
    );
    cursorY += 10;

    addSectionTitle(doc, "Line Items", cursorY);
    cursorY += 4;

    const lineItems = asItems<UnknownRecord>(proposal.lineItems);
    autoTable(doc, {
      startY: cursorY,
      head: [["Description", "Qty", "Unit Price", "Discount", "Tax", "Total"]],
      body: lineItems.map((item) => [
        String(item.description ?? item.productServiceName ?? "-"),
        toNumber(item.quantity).toFixed(2),
        toNumber(item.unitPrice).toFixed(2),
        toNumber(item.discount).toFixed(2),
        toNumber(item.taxRate).toFixed(2),
        toNumber(item.total).toFixed(2),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    const tableEnd = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY;
    const finalY = (tableEnd ?? cursorY) + 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Calculated Total: ${totals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, finalY);
    doc.setFont("helvetica", "normal");

    savePdf(doc, "Proposal", proposalTitle, layout);
  }

  async generateContractPdf(id: string) {
    const layout = await createLayout("Contract Document");
    const response = await this.axios.get(`/api/Contracts/${id}`);
    const contract = response.data as UnknownRecord;

    const doc = createPdfDocument();
    let cursorY = applyPdfLayoutToPage(doc, layout);
    const title = String(contract.title ?? `Contract-${id}`);

    doc.setFontSize(11);
    [
      `Contract Title: ${title}`,
      `Client: ${String(contract.clientName ?? contract.clientId ?? "-")}`,
      `Linked Opportunity: ${String(contract.opportunityTitle ?? contract.opportunityId ?? "-")}`,
      `Contract Value: ${toNumber(contract.contractValue).toLocaleString()}`,
      `Currency: ${String(contract.currency ?? "-")}`,
      `Start Date: ${formatDate(contract.startDate as string | undefined)}`,
      `End Date: ${formatDate(contract.endDate as string | undefined)}`,
      `Renewal Notice Period: ${toNumber(contract.renewalNoticePeriod)} days`,
    ].forEach((line) => {
      doc.text(line, 14, cursorY);
      cursorY += 7;
    });

    cursorY += 3;
    addSectionTitle(doc, "Terms", cursorY);
    cursorY += 6;
    const terms = String(contract.terms ?? "").trim() || "No terms provided.";
    const wrappedTerms = doc.splitTextToSize(terms, 182);
    doc.text(wrappedTerms, 14, cursorY);
    cursorY += wrappedTerms.length * 5 + 12;

    addSectionTitle(doc, "Signatures", cursorY);
    cursorY += 12;
    doc.line(20, cursorY, 90, cursorY);
    doc.line(120, cursorY, 190, cursorY);
    cursorY += 5;
    doc.setFontSize(9);
    doc.text("Authorised Signatory", 20, cursorY);
    doc.text("Client Signatory", 120, cursorY);

    savePdf(doc, "Contract", title, layout);
  }

  async generateOpportunitySummaryPdf(id: string) {
    const layout = await createLayout("Opportunity Summary");
    const [opportunityResponse, stageHistoryResponse, proposalsResponse, contractsResponse] =
      await Promise.all([
        this.axios.get(`/api/Opportunities/${id}`),
        this.axios.get(`/api/Opportunities/${id}/stage-history`),
        this.axios.get("/api/Proposals", { params: { opportunityId: id, pageNumber: 1, pageSize: 100 } }),
        this.axios.get("/api/Contracts", { params: { pageNumber: 1, pageSize: 200 } }),
      ]);

    const opportunity = opportunityResponse.data as UnknownRecord;
    const stageHistory = asItems<UnknownRecord>(stageHistoryResponse.data);
    const proposals = asItems<UnknownRecord>(proposalsResponse.data);
    const contracts = asItems<UnknownRecord>(contractsResponse.data).filter(
      (contract) => String(contract.opportunityId ?? "") === id
    );

    const doc = createPdfDocument();
    let cursorY = applyPdfLayoutToPage(doc, layout);
    const title = String(opportunity.title ?? `Opportunity-${id}`);

    doc.setFontSize(11);
    [
      `Title: ${title}`,
      `Client: ${String(opportunity.clientName ?? opportunity.clientId ?? "-")}`,
      `Stage: ${
        OpportunityStageLabels[
          toNumber(opportunity.stage) as keyof typeof OpportunityStageLabels
        ] ?? String(opportunity.stage ?? "-")
      }`,
      `Estimated Value: ${toNumber(opportunity.estimatedValue).toLocaleString()}`,
      `Probability: ${toNumber(opportunity.probability)}%`,
      `Expected Close Date: ${formatDate(opportunity.expectedCloseDate as string | undefined)}`,
    ].forEach((line) => {
      doc.text(line, 14, cursorY);
      cursorY += 7;
    });

    cursorY += 2;
    addSectionTitle(doc, "Stage History", cursorY);
    autoTable(doc, {
      startY: cursorY + 3,
      head: [["Previous", "New", "Reason", "Changed At"]],
      body: stageHistory.map((entry) => [
        OpportunityStageLabels[toNumber(entry.previousStage) as keyof typeof OpportunityStageLabels] ??
          String(entry.previousStage ?? "-"),
        OpportunityStageLabels[toNumber(entry.newStage) as keyof typeof OpportunityStageLabels] ??
          String(entry.newStage ?? "-"),
        String(entry.reason ?? "-"),
        formatDate(entry.changedAt as string | undefined),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    cursorY =
      ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY) +
      8;
    addSectionTitle(doc, "Linked Proposals", cursorY);
    autoTable(doc, {
      startY: cursorY + 3,
      head: [["Title", "Status", "Total"]],
      body: proposals.map((proposal) => [
        String(proposal.title ?? proposal.id ?? "-"),
        String(proposal.statusName ?? proposal.status ?? "-"),
        toNumber(proposal.grandTotal ?? proposal.totalAmount).toLocaleString(),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    cursorY =
      ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY) +
      8;
    addSectionTitle(doc, "Linked Contracts", cursorY);
    autoTable(doc, {
      startY: cursorY + 3,
      head: [["Title", "Value", "Start", "End"]],
      body: contracts.map((contract) => [
        String(contract.title ?? contract.id ?? "-"),
        toNumber(contract.contractValue).toLocaleString(),
        formatDate(contract.startDate as string | undefined),
        formatDate(contract.endDate as string | undefined),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    savePdf(doc, "Opportunity", title, layout);
  }

  async generateReportPdf(filters: { groupBy?: string } = {}) {
    const layout = await createLayout("Reports Export");
    const [opportunitiesResponse, salesResponse] = await Promise.all([
      this.axios.get("/api/Reports/opportunities"),
      this.axios.get("/api/Reports/sales-by-period", {
        params: { groupBy: filters.groupBy ?? "month" },
      }),
    ]);
    const opportunities = asItems<UnknownRecord>(opportunitiesResponse.data);
    const salesByPeriod = asItems<UnknownRecord>(salesResponse.data);

    const doc = createPdfDocument();
    let cursorY = applyPdfLayoutToPage(doc, layout);
    doc.setFontSize(11);
    doc.text(`Filters: groupBy=${filters.groupBy ?? "month"}`, 14, cursorY);
    cursorY += 8;

    addSectionTitle(doc, "Opportunities Report", cursorY);
    autoTable(doc, {
      startY: cursorY + 3,
      head: [["Title", "Owner", "Stage", "Estimated Value"]],
      body: opportunities.map((entry) => [
        String(entry.title ?? "-"),
        String(entry.ownerName ?? "-"),
        String(entry.stageName ?? entry.stage ?? "-"),
        toNumber(entry.estimatedValue).toLocaleString(),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    cursorY =
      ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY) +
      8;
    addSectionTitle(doc, "Sales by Period", cursorY);
    autoTable(doc, {
      startY: cursorY + 3,
      head: [["Period", "Revenue"]],
      body: salesByPeriod.map((entry) => [
        String(entry.period ?? "-"),
        toNumber(entry.totalRevenue).toLocaleString(),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    const totalRevenue = salesByPeriod.reduce(
      (sum, entry) => sum + toNumber(entry.totalRevenue),
      0
    );
    const totalsY =
      ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY) +
      8;
    doc.setFont("helvetica", "bold");
    doc.text(`Aggregated Total Revenue: ${totalRevenue.toLocaleString()}`, 14, totalsY);
    doc.setFont("helvetica", "normal");

    savePdf(doc, "Report", "Sales-Opportunity-Report", layout);
  }

  async generateClientSummaryPdf(id: string) {
    const layout = await createLayout("Client Summary");
    const [clientResponse, statsResponse, contractsResponse] = await Promise.all([
      this.axios.get(`/api/Clients/${id}`),
      this.axios.get(`/api/Clients/${id}/stats`),
      this.axios.get(`/api/Contracts/client/${id}`),
    ]);

    const client = clientResponse.data as UnknownRecord;
    const stats = statsResponse.data as UnknownRecord;
    const contracts = asItems<UnknownRecord>(contractsResponse.data);
    const activeContracts = contracts.filter((entry) =>
      ["2", "Active", "active"].includes(String(entry.status ?? entry.statusName ?? ""))
    );

    const doc = createPdfDocument();
    let cursorY = applyPdfLayoutToPage(doc, layout);
    const clientName = String(client.name ?? `Client-${id}`);
    doc.setFontSize(11);
    [
      `Client Profile: ${clientName}`,
      `Industry: ${String(client.industry ?? "-")}`,
      `Company Size: ${String(client.companySize ?? "-")}`,
      `Website: ${String(client.website ?? "-")}`,
      `Total Opportunities: ${toNumber(stats.opportunityCount)}`,
      `Total Contracts: ${toNumber(stats.contractCount)}`,
      `Total Contract Value: ${toNumber(stats.totalContractValue).toLocaleString()}`,
    ].forEach((line) => {
      doc.text(line, 14, cursorY);
      cursorY += 7;
    });

    cursorY += 2;
    addSectionTitle(doc, "Active Contracts", cursorY);
    autoTable(doc, {
      startY: cursorY + 3,
      head: [["Title", "Value", "Start", "End", "Status"]],
      body: activeContracts.map((entry) => [
        String(entry.title ?? entry.id ?? "-"),
        toNumber(entry.contractValue).toLocaleString(),
        formatDate(entry.startDate as string | undefined),
        formatDate(entry.endDate as string | undefined),
        String(entry.statusName ?? entry.status ?? "-"),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [39, 84, 138] },
      margin: { left: 14, right: 14 },
    });

    savePdf(doc, "Client", clientName, layout);
  }
}

export const pdfService = new PdfService();
