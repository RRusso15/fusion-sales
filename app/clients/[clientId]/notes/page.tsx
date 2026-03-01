"use client";

import { useParams } from "next/navigation";
import { NotesModule } from "@/app/notes/page";

export default function ClientNotesPage() {
  const params = useParams<{ clientId: string }>();
  return <NotesModule clientId={params.clientId} />;
}
