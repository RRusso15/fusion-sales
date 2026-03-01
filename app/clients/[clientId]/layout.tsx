import { AuthGuard } from "@/components/guards/AuthGuard";
import { ClientWorkspaceLayout as WorkspaceLayout } from "@/components/layout/ClientWorkspaceLayout";
import { ClientProvider } from "@/providers/clientProvider";
import { ContactProvider } from "@/providers/contactProvider";

export default async function ClientWorkspaceRouteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <AuthGuard>
      <ClientProvider>
        <ContactProvider>
          <WorkspaceLayout clientId={clientId}>{children}</WorkspaceLayout>
        </ContactProvider>
      </ClientProvider>
    </AuthGuard>
  );
}
