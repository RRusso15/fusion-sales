import { NextRequest, NextResponse } from "next/server";

interface RecommendationPayload {
  documentId?: string;
  fileName?: string;
  category?: number;
  description?: string;
  documentText?: string;
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

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RecommendationPayload;
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { message: "AI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.AI_BASE_URL?.replace(/\/$/, "") ??
      "https://openrouter.ai/api/v1";
    const model =
      process.env.AI_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

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
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: "AI recommendation failed.", details: errorText },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { message: "AI returned no content." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(extractJsonObject(content));
    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected AI error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
