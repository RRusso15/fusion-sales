import type { jsPDF } from "jspdf";

export interface PdfHeaderOptions {
  documentType: string;
  logoDataUrl?: string;
}

export const drawPdfHeader = (doc: jsPDF, options: PdfHeaderOptions) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(32, 52, 84);
  doc.text(options.documentType, 14, 18);

  if (options.logoDataUrl) {
    doc.addImage(options.logoDataUrl, "PNG", pageWidth - 46, 8, 32, 16);
  }

  doc.setDrawColor(220, 226, 233);
  doc.line(14, 24, pageWidth - 14, 24);
  return 30;
};
