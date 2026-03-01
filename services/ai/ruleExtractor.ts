import { OpportunitySource } from "@/constants/enums";
import type { SetupPlan } from "@/types/setupPlan";
import { normalizeSetupPlan } from "@/services/ai/setupPlanUtils";

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/g;
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i;
const CURRENCY_REGEX =
  /(?:ZAR|R)\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;

const toDateOnly = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

const detectDate = (text: string) => {
  const directIso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (directIso?.[1]) return directIso[1];

  const common = text.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-](?:20)?\d{2})\b/);
  if (common?.[1]) {
    const parsed = toDateOnly(common[1]);
    if (parsed) return parsed;
  }

  const monthName = text.match(
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/i
  );
  if (monthName?.[1]) {
    const parsed = toDateOnly(monthName[1]);
    if (parsed) return parsed;
  }

  return undefined;
};

const titleFromText = (text: string) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lineMatch = lines.find((line) =>
    /(?:opportunity|project|rfp|request|tender)/i.test(line)
  );
  if (lineMatch) return lineMatch.slice(0, 90);
  return lines[0]?.slice(0, 90) ?? "New Opportunity";
};

const detectClientName = (text: string) => {
  const explicit =
    text.match(/(?:client|company|organization|organisation|customer)\s*:\s*(.+)/i)?.[1] ??
    text.match(/(?:for)\s+([A-Z][A-Za-z0-9&.,\- ]{2,})/i)?.[1];
  if (explicit) return explicit.split(/\r?\n/)[0].trim().slice(0, 120);

  const allCapsLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^[A-Z][A-Za-z0-9&.,\- ]{3,}$/.test(line) && !/:/.test(line));
  return allCapsLine?.slice(0, 120);
};

const detectIndustry = (text: string) =>
  text.match(/industry\s*:\s*([^\n\r]+)/i)?.[1]?.trim();

const inferSource = (textLower: string) => {
  if (textLower.includes("rfp")) return OpportunitySource.Rfp;
  if (textLower.includes("referral")) return OpportunitySource.Referral;
  if (textLower.includes("outbound")) return OpportunitySource.Outbound;
  if (textLower.includes("inbound")) return OpportunitySource.Inbound;
  return undefined;
};

const buildSummaryNote = (text: string) => {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.slice(0, 3).join(" ").slice(0, 700);
};

const extractContacts = (text: string) => {
  const emails = Array.from(new Set(text.match(EMAIL_REGEX) ?? []));
  const phones = Array.from(new Set(text.match(PHONE_REGEX) ?? []));

  return emails.map((email, index) => {
    const beforeEmail = text
      .slice(Math.max(0, text.indexOf(email) - 60), text.indexOf(email))
      .replace(/[\r\n]+/g, " ")
      .trim();
    const nameMatch = beforeEmail.match(/([A-Z][a-z]+)\s+([A-Z][a-z'-]+)/);
    return {
      firstName: nameMatch?.[1] ?? (index === 0 ? "Primary" : "Contact"),
      lastName: nameMatch?.[2] ?? `${index + 1}`,
      email,
      phoneNumber: phones[index],
      isPrimaryContact: index === 0,
    };
  });
};

const buildActivities = (textLower: string) => {
  const suggestions: Array<{ type: 1 | 2 | 3 | 4 | 5 | 6; subject: string }> = [];
  if (textLower.includes("meeting")) suggestions.push({ type: 1, subject: "Schedule client meeting" });
  if (textLower.includes("call")) suggestions.push({ type: 2, subject: "Client discovery call" });
  if (textLower.includes("demo")) suggestions.push({ type: 5, subject: "Product demo preparation" });
  if (textLower.includes("presentation"))
    suggestions.push({ type: 5, subject: "Prepare proposal presentation" });

  if (suggestions.length === 0) return [];
  const due = new Date();
  due.setDate(due.getDate() + 3);
  return suggestions.map((item) => ({
    type: item.type,
    subject: item.subject,
    priority: 2 as const,
    dueDate: due.toISOString(),
    assignToRoleHint: "SalesRep" as const,
  }));
};

export function extractSetupPlanRules(text: string): SetupPlan {
  const cleanText = text.replace(/\r/g, "\n").trim();
  const lower = cleanText.toLowerCase();
  const website = cleanText.match(URL_REGEX)?.[0];
  const clientName = detectClientName(cleanText);
  const industry = detectIndustry(cleanText);
  const contacts = extractContacts(cleanText);
  const amountMatch = cleanText.match(CURRENCY_REGEX)?.[1];
  const estimatedValue = amountMatch ? Number(amountMatch.replace(/,/g, "")) : undefined;
  const expectedCloseDate = detectDate(cleanText);
  const source = inferSource(lower);

  const shouldCreateOpportunity =
    /(?:opportunity|project|rfp|request|brief|tender|proposal)/i.test(cleanText);
  const shouldCreatePricing = /(?:quote|pricing|price|costing)/i.test(cleanText);

  const draft: SetupPlan = {
    client: clientName
      ? {
          name: clientName,
          industry,
          website,
        }
      : null,
    contacts,
    opportunity: shouldCreateOpportunity
      ? {
          title: titleFromText(cleanText),
          estimatedValue,
          currency: "ZAR",
          stage: 1,
          source,
          probability: 30,
          expectedCloseDate,
          description: cleanText.slice(0, 1200),
          contactMatch: contacts[0]
            ? {
                email: contacts[0].email,
                fullName: `${contacts[0].firstName} ${contacts[0].lastName}`.trim(),
              }
            : undefined,
        }
      : null,
    activities: buildActivities(lower),
    pricingRequest: shouldCreatePricing
      ? {
          title: `Pricing Request - ${titleFromText(cleanText)}`,
          description: "Auto-generated from uploaded lead/RFP/brief document.",
          priority: 3,
          assignToRoleHint: "SalesManager",
        }
      : null,
    notes: cleanText
      ? [
          {
            content: buildSummaryNote(cleanText) || "Document extracted with setup suggestions.",
            relatedTo: "Client",
            isPrivate: false,
          },
        ]
      : [],
  };

  return normalizeSetupPlan(draft);
}
