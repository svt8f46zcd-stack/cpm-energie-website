import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email) return NextResponse.json({ error: "Name und E-Mail sind erforderlich." }, { status: 400 });
  // TODO: Hier Resend/Formspree anschließen. Noch keine E-Mail-Daten fest einbauen.
  console.log("Neue CPM Energie Anfrage", body);
  return NextResponse.json({ ok: true });
}
