import { NextRequest, NextResponse } from "next/server";

interface RecommendationPayload {
  documentId?: string;
  fileName?: string;
  category?: number;
  description?: string;
  documentText?: string;
}

const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 20000);

interface RecommendationResponse {
  documentType: "lead" | "contract" | "invoice" | "proposal" | "report" | "other";
  recommendedAction: "create_lead_opportunity" | "none";
  confidence: number;
  reasoning: string;
  extracted: {
    clientName: string | null;
    industry: string | null;
    website: string | null;
    contactFirstName: string | null;
    contactLastName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactPosition: string | null;
    opportunityTitle: string | null;
    estimatedValue: number | null;
    source: "Inbound" | "Outbound" | "Referral" | "Partner" | "RFP" | null;
  };
}

const SYSTEM_PROMPT = `You classify sales documents and extract CRM fields.
Return valid JSON only with this shape:
{
  "documentType": "lead|contract|invoice|proposal|report|other",
  "recommendedAction": "create_lead_opportunity|none",
  "confidence": number,
  "reasoning": string,
  "extracted": {
    "clientName": string|null,
    "industry": string|null,
    "website": string|null,
    "contactFirstName": string|null,
    "contactLastName": string|null,
    "contactEmail": string|null,
    "contactPhone": string|null,
    "contactPosition": string|null,
    "opportunityTitle": string|null,
    "estimatedValue": number|null,
    "source": "Inbound|Outbound|Referral|Partner|RFP"|null
  }
}
Rules:
- If document looks like a lead, set recommendedAction=create_lead_opportunity.
- Confidence must be between 0 and 1.
- Use null for missing fields.
- Be concise in reasoning.
- Never return markdown fences.`;

const extractJsonObject = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
};

const toTitle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildHeuristicRecommendation = (
  payload: RecommendationPayload,
  reason: string
): RecommendationResponse => {
  const text = payload.documentText ?? "";
  const lower = text.toLowerCase();
  const fileName = (payload.fileName ?? "").toLowerCase();

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/
  );
  const websiteMatch = text.match(/https?:\/\/[^\s]+|www\.[^\s]+/i);
  const amountMatch = text.match(
    /(?:USD|US\$|\$)\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/
  );
  const leadSignals = [
    "lead",
    "rfq",
    "rfi",
    "request for quote",
    "request for information",
    "quotation",
    "prospect",
    "demo",
    "proposal request",
    "introduction",
    "capability statement",
  ];
  const contractSignals = ["contract", "msa", "agreement", "terms and conditions"];
  const invoiceSignals = ["invoice", "bill to", "amount due", "due date", "payment terms"];
  const proposalSignals = ["proposal", "scope of work", "deliverables"];
  const reportSignals = ["report", "findings", "analysis", "summary"];

  const signalScore = (signals: string[]) =>
    signals.reduce((count, signal) => count + (lower.includes(signal) ? 1 : 0), 0) +
    signals.reduce((count, signal) => count + (fileName.includes(signal) ? 1 : 0), 0);

  const leadScore = signalScore(leadSignals);
  const contractScore = signalScore(contractSignals);
  const invoiceScore = signalScore(invoiceSignals);
  const proposalScore = signalScore(proposalSignals);
  const reportScore = signalScore(reportSignals);

  const byScore = [
    { type: "lead", score: leadScore },
    { type: "contract", score: contractScore },
    { type: "invoice", score: invoiceScore },
    { type: "proposal", score: proposalScore },
    { type: "report", score: reportScore },
  ].sort((a, b) => b.score - a.score);

  const top = byScore[0];
  const documentType =
    top.score > 0
      ? (top.type as RecommendationResponse["documentType"])
      : "other";
  const recommendedAction =
    documentType === "lead" ? "create_lead_opportunity" : "none";
  const confidence = Math.max(
    0.35,
    Math.min(0.85, 0.35 + top.score * 0.15 + (emailMatch ? 0.08 : 0))
  );

  const namedContact =
    text.match(
      /(?:contact|attention|attn|prepared by|from)\s*:?\s*([A-Za-z]+)\s+([A-Za-z][A-Za-z'-]+)/i
    ) ?? undefined;
  const orgMatch =
    text.match(/(?:company|organization|client|customer)\s*:?\s*([^\n,;]+)/i) ??
    text.match(/(?:for|to)\s+([A-Z][A-Za-z0-9&.,\- ]{2,})/);

  const parsedAmount = amountMatch?.[1]
    ? Number(amountMatch[1].replace(/,/g, ""))
    : null;
  const baseName = (payload.fileName ?? "Document").replace(/\.[^/.]+$/, "");

  return {
    documentType,
    recommendedAction,
    confidence,
    reasoning: `Heuristic fallback used: ${reason}`,
    extracted: {
      clientName: orgMatch?.[1]?.trim() ? toTitle(orgMatch[1].trim()) : null,
      industry: null,
      website: websiteMatch?.[0] ?? null,
      contactFirstName: namedContact?.[1] ?? null,
      contactLastName: namedContact?.[2] ?? null,
      contactEmail: emailMatch?.[0] ?? null,
      contactPhone: phoneMatch?.[0] ?? null,
      contactPosition: null,
      opportunityTitle:
        documentType === "lead" ? `${toTitle(baseName)} Opportunity` : null,
      estimatedValue: Number.isFinite(parsedAmount) ? parsedAmount : null,
      source: "Inbound",
    },
  };
};

export async function POST(request: NextRequest) {
  let payload: RecommendationPayload = {};
  try {
    payload = (await request.json()) as RecommendationPayload;
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        buildHeuristicRecommendation(payload, "AI_API_KEY is not configured.")
      );
    }

    const baseUrl =
      process.env.AI_BASE_URL?.replace(/\/$/, "") ??
      "https://openrouter.ai/api/v1";
    const primaryModel =
      process.env.AI_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
    const fallbackModels = [
      "openrouter/free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "qwen/qwen2.5-7b-instruct:free",
      "deepseek/deepseek-r1:free",
    ];
    const modelsToTry = Array.from(
      new Set([primaryModel, ...fallbackModels])
    );

    const userPrompt = JSON.stringify(
      {
        documentId: payload.documentId ?? null,
        fileName: payload.fileName ?? null,
        category: payload.category ?? null,
        description: payload.description ?? null,
        documentText: (payload.documentText ?? "").slice(0, 12000),
      },
      null,
      2
    );

    let lastFailure = "No model attempts were made.";

    for (const model of modelsToTry) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
          }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastFailure = `${model} failed (${response.status}): ${errorText.slice(0, 120)}`;
          continue;
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          lastFailure = `${model} returned empty content`;
          continue;
        }

        const parsed = JSON.parse(extractJsonObject(content));
        return NextResponse.json(parsed);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          lastFailure = `${model} timed out after ${REQUEST_TIMEOUT_MS}ms`;
        } else {
          lastFailure =
            error instanceof Error
              ? `${model} error: ${error.message}`
              : `${model} unknown error`;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    return NextResponse.json(
      buildHeuristicRecommendation(payload, `All models failed. ${lastFailure}`)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected AI error.";
    return NextResponse.json(
      buildHeuristicRecommendation(payload, message)
    );
  }
}
