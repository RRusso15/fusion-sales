import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

const normalizeText = (value: string) =>
  value
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const asUtf8 = (buffer: Buffer) => {
  try {
    return buffer.toString("utf8");
  } catch {
    return "";
  }
};

const isPdf = (fileName: string, contentType: string) =>
  fileName.endsWith(".pdf") || contentType.includes("pdf");

const isDocx = (fileName: string, contentType: string) =>
  fileName.endsWith(".docx") ||
  contentType.includes(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "A file is required." },
        { status: 400 }
      );
    }

    const fileName = (file.name || "document").toLowerCase();
    const contentType = (file.type || "").toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";

    if (isPdf(fileName, contentType)) {
      const parser = new PDFParse({ data: buffer });
      try {
        const pdfText = await parser.getText();
        text = pdfText.text ?? "";
      } finally {
        await parser.destroy();
      }
    } else if (isDocx(fileName, contentType)) {
      const docxResult = await mammoth.extractRawText({ buffer });
      text = docxResult.value ?? "";
    } else if (
      contentType.startsWith("text/") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".json") ||
      fileName.endsWith(".xml") ||
      fileName.endsWith(".html") ||
      fileName.endsWith(".htm")
    ) {
      text = asUtf8(buffer);
    }

    const normalized = normalizeText(text).slice(0, 12000);
    return NextResponse.json({ text: normalized, hasText: normalized.length > 0 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to extract document text.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
