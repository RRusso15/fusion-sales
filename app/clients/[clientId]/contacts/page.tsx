"use client";

import { useParams } from "next/navigation";
import { ContactsModule } from "@/app/contacts/page";

export default function ClientContactsPage() {
  const params = useParams<{ clientId: string }>();
  return <ContactsModule clientId={params.clientId} />;
}
