import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendOutboundWhatsAppMessage } from "../../../../services/whatsapp/outbound.service";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

type SendMessageRequest = {
  conversationId?: string;
  body?: string;
  templateId?: string;
  customVariables?: Record<string, string>;
  forceMode?: "auto" | "text" | "template";
};

type UserAuthContext = {
  userId: string;
  role: "superadmin" | "admin" | "agente";
  countryId: string | null;
};

type ConversationScopeRow = {
  id: string;
  leads?:
    | {
        id?: string;
        pais?: string | null;
        agente_id?: string | null;
      }
    | Array<{
        id?: string;
        pais?: string | null;
        agente_id?: string | null;
      }>
    | null;
};

const getUserAuthContext = async (request: NextRequest): Promise<UserAuthContext | null> => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: () => undefined,
        remove: () => undefined,
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, country_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  if (profile.role !== "superadmin" && profile.role !== "admin" && profile.role !== "agente") {
    return null;
  }

  return {
    userId: user.id,
    role: profile.role,
    countryId: profile.country_id,
  };
};

const isConversationInScope = async (
  conversationId: string,
  auth: UserAuthContext
): Promise<boolean> => {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("id, leads(id, pais, agente_id)")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return false;
  }

  const scopedConversation = conversation as ConversationScopeRow;
  const scopedLeads = scopedConversation.leads;
  const leadData = Array.isArray(scopedLeads) ? scopedLeads[0] : scopedLeads;

  if (!leadData) {
    return false;
  }

  if (auth.role === "superadmin") {
    return true;
  }

  if (auth.role === "agente") {
    return leadData.agente_id === auth.userId;
  }

  if (auth.role === "admin") {
    if (!auth.countryId || !leadData.pais) {
      return false;
    }

    const { data: country, error: countryError } = await supabaseAdmin
      .from("countries")
      .select("id, name")
      .eq("id", auth.countryId)
      .maybeSingle();

    if (countryError || !country) {
      return false;
    }

    const adminCountry = String(country.name ?? "").trim().toLowerCase();
    const leadCountry = String(leadData.pais ?? "").trim().toLowerCase();
    return Boolean(adminCountry) && adminCountry === leadCountry;
  }

  return false;
};

export async function POST(request: NextRequest) {
  const auth = await getUserAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const allowed = await isConversationInScope(conversationId, auth);
  if (!allowed) {
    return NextResponse.json(
      { error: "No autorizado para enviar mensajes en esta conversación" },
      { status: 403 }
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