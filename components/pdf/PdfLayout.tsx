import { jsPDF } from "jspdf";
import { drawPdfFooter, type PdfFooterOptions } from "@/components/pdf/PdfFooter";
import { drawPdfHeader, type PdfHeaderOptions } from "@/components/pdf/PdfHeader";

export interface PdfLayoutOptions {
  header: PdfHeaderOptions;
  footer: PdfFooterOptions;
}

export const createPdfDocument = () => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");
  return doc;
};

export const drawPdfWatermark = (doc: jsPDF, watermark = "Fusion Sales") => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.saveGraphicsState();
  doc.setTextColor(235, 239, 244);
  doc.setFontSize(52);
  doc.text(watermark, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 330,
  });
  doc.restoreGraphicsState();
};

export const applyPdfLayoutToPage = (doc: jsPDF, options: PdfLayoutOptions) => {
  drawPdfWatermark(doc);
  return drawPdfHeader(doc, options.header);
};

export const applyPdfFooters = (doc: jsPDF, options: PdfLayoutOptions) => {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPdfFooter(doc, page, pageCount, options.footer);
  }
};
