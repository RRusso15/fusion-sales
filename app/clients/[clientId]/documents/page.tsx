"use client";

import { useParams } from "next/navigation";
import { DocumentsModule } from "@/app/documents/page";

export default function ClientDocumentsPage() {
  const params = useParams<{ clientId: string }>();
  return <DocumentsModule clientId={params.clientId} />;
}
