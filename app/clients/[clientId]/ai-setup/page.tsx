"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { AiSetupWizard } from "@/components/ai/AiSetupWizard";

export default function ExistingClientAiSetupPage() {
  const params = useParams<{ clientId: string }>();
  return (
    <AuthGuard>
      <AiSetupWizard existingClientId={params.clientId} />
    </AuthGuard>
  );
}
