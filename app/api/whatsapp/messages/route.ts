import { NextResponse, type NextRequest } from "next/server";
import { sendOutboundWhatsAppMessage } from "../../../../services/whatsapp/outbound.service";

type SendMessageRequest = {
  conversationId?: string;
  body?: string;
  templateId?: string;
  customVariables?: Record<string, string>;
  forceMode?: "auto" | "text" | "template";
};

export async function POST(request: NextRequest) {
  let payload: SendMessageRequest;
  try {
    payload = (await request.json()) as SendMessageRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const conversationId = payload.conversationId?.trim();
  const body = payload.body?.trim();

  if (!conversationId || !body) {
    return NextResponse.json(
      { error: "`conversationId` y `body` son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const result = await sendOutboundWhatsAppMessage({
      conversationId,
      body,
      templateId: payload.templateId,
      customVariables: payload.customVariables,
      forceMode: payload.forceMode,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
      },
      { status: 502 }
    );
  }
}