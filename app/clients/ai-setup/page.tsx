"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { AiSetupWizard } from "@/components/ai/AiSetupWizard";

export default function ClientAiSetupPage() {
  return (
    <AuthGuard>
      <AiSetupWizard />
    </AuthGuard>
  );
}
