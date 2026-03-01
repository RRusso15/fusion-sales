import { redirect } from "next/navigation";

export default async function ClientWorkspaceIndexPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  redirect(`/clients/${clientId}/overview`);
}
