import { AuthGuard } from "@/components/guards/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="Admin">
      {children}
    </AuthGuard>
  );
}