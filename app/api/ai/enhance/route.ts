import { NextRequest, NextResponse } from "next/server";
import type { SetupPlan } from "@/types/setupPlan";
import { isSetupPlanLike, normalizeSetupPlan } from "@/services/ai/setupPlanUtils";

interface EnhancePayload {
  text?: string;
  draftPlan?: unknown;
}

const REQUEST_TIMEOUT_MS = 25000;

const setupPlanSchema = `SetupPlan JSON schema:
{
  "client": {
    "name": "string",
    "industry": "string?",
    "clientType": "1|2|3?",
    "website": "string?",
    "billingAddress": "string?",
    "taxNumber": "string?",
    "companySize": "string?"
  } | null,
  "contacts": [
    {
      "firstName": "string",
      "lastName": "string",
      "email": "string?",
      "phoneNumber": "string?",
      "position": "string?",
      "isPrimaryContact": "boolean?"
    }
  ],
  "opportunity": {
    "title": "string",
    "clientId": "string?",
    "contactMatch": { "email": "string?", "fullName": "string?" }?,
    "estimatedValue": "number?",
    "currency": "string?",
    "stage": "1|2|3|4|5|6?",
    "source": "1|2|3|4|5?",
    "probability": "number?",
    "expectedCloseDate": "YYYY-MM-DD?",
    "description": "string?"
  } | null,
  "activities": [
    {
      "type": "1|2|3|4|5|6",
      "subject": "string",
      "description": "string?",
      "priority": "1|2|3|4?",
      "dueDate": "ISO datetime?",
      "duration": "number?",
      "location": "string?",
      "assignToRoleHint": "Admin|SalesManager|BusinessDevelopmentManager|SalesRep|null"
    }
  ],
  "pricingRequest": {
    "title": "string",
    "description": "string?",
    "priority": "1|2|3|4?",
    "requiredByDate": "YYYY-MM-DD?",
    "assignToRoleHint": "SalesManager|BusinessDevelopmentManager|null"
  } | null,
  "notes": [
    {
      "content": "string",
      "isPrivate": "boolean?",
      "relatedTo": "Client|Opportunity"
    }
  ]
}`;

const enumGuide = `Enum guide:
ClientType: 1 Government, 2 Private, 3 Partner
OpportunityStage: 1 Lead, 2 Qualified, 3 Proposal, 4 Negotiation, 5 Closed Won, 6 Closed Lost
OpportunitySource: 1 Inbound, 2 Outbound, 3 Referral, 4 Partner, 5 RFP
ActivityType: 1 Meeting, 2 Call, 3 Email, 4 Task, 5 Presentation, 6 Other
Priority: 1 Low, 2 Medium, 3 High, 4 Urgent

Defaults:
opportunity.currency = "ZAR"
opportunity.stage = 1
opportunity.probability = 30
activities.priority = 2`;

const extractJsonObject = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
};

const callAi = async (messages: Array<{ role: "system" | "user"; content: string }>) => {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    throw new Error("AI configuration is missing.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI request failed (${response.status}): ${errorText.slice(0, 180)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI response was empty.");
    return content;
  } finally {
    clearTimeout(timeout);
  }
};

const parsePlan = (content: string): SetupPlan | null => {
  try {
    const parsed = JSON.parse(extractJsonObject(content));
    if (!isSetupPlanLike(parsed)) return null;
    return normalizeSetupPlan(parsed);
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  let draftPlan: SetupPlan = normalizeSetupPlan({});
  try {
    const payload = (await request.json()) as EnhancePayload;
    const text = String(payload.text ?? "").slice(0, 12000);
    draftPlan = normalizeSetupPlan(payload.draftPlan);

    const baseMessages = [
      {
        role: "system" as const,
        content:
          "Return ONLY valid JSON matching SetupPlan schema. No markdown. No commentary.",
      },
      {
        role: "user" as const,
        content: `${setupPlanSchema}\n\n${enumGuide}\n\nDraft plan:\n${JSON.stringify(
          draftPlan
        )}\n\nRaw text:\n${text}`,
      },
    ];

    const first = await callAi(baseMessages);
    const parsedFirst = parsePlan(first);
    if (parsedFirst) {
      return NextResponse.json({ plan: parsedFirst });
    }

    const second = await callAi([
      ...baseMessages,
      {
        role: "user",
        content:
          "Fix JSON ONLY. Return strictly valid SetupPlan JSON with all required top-level keys.",
      },
    ]);
    const parsedSecond = parsePlan(second);
    if (parsedSecond) {
      return NextResponse.json({ plan: parsedSecond, warning: "AI response required one JSON fix retry." });
    }

    return NextResponse.json({
      plan: draftPlan,
      warning: "AI output invalid, using draft.",
    });
  } catch {
    return NextResponse.json({
      plan: draftPlan,
      warning: "AI enhancement unavailable, using draft.",
    });
  }
}
