import { AuthGuard } from "@/components/guards/AuthGuard";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="SalesRep">
      {children}
    </AuthGuard>
  );
}