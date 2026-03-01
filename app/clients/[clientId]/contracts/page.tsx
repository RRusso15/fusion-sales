"use client";

import { useParams } from "next/navigation";
import { ContractsModule } from "@/app/contracts/page";

export default function ClientContractsPage() {
  const params = useParams<{ clientId: string }>();
  return <ContractsModule clientId={params.clientId} />;
}
