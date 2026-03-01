"use client";

import { AuthenticatedLayout } from "./AuthenticatedLayout";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

