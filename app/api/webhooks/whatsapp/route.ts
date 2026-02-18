import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  logWebhookEvent,
  parseWhatsAppWebhookPayload,
  processWhatsAppWebhook,
} from "../../../../services/whatsapp/webhook.service";

const verifyMetaSignature = (
  rawPayload: string,
  signatureHeader: string | null,
  appSecret: string
): boolean => {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const receivedSignature = signatureHeader.replace("sha256=", "").trim();
  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawPayload, "utf8")
    .digest("hex");

  const receivedBuffer = Buffer.from(receivedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const reason = !mode
    ? "missing_mode"
    : mode !== "subscribe"
      ? "invalid_mode"
      : !token
        ? "missing_verify_token_query"
        : !verifyToken
          ? "missing_verify_token_env"
          : "verify_token_mismatch";

  return NextResponse.json(
    { error: "Webhook verification failed", reason },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (appSecret && !verifyMetaSignature(rawBody, signatureHeader, appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const event = parseWhatsAppWebhookPayload(payload);
  await logWebhookEvent(event);
  const summary = await processWhatsAppWebhook(payload);

  return NextResponse.json({ received: true, summary }, { status: 200 });
}