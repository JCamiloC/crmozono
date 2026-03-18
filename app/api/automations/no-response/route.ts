import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { runNoResponseAutomation } from "../../../../services/automations/no-response.service";
import { runSlaCloseAutomation } from "../../../../services/automations/sla-close.service";

const hasValidAutomationToken = (request: NextRequest): boolean => {
  const configuredToken = process.env.CRON_SECRET ?? process.env.AUTOMATIONS_RUN_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const providedToken = extractToken(request);
  return providedToken === configuredToken;
};

const hasAdminSession = async (request: NextRequest): Promise<boolean> => {
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
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return false;
  }

  return profile.role === "admin" || profile.role === "superadmin";
};

const extractToken = (request: NextRequest): string | null => {
  const headerToken = request.headers.get("x-automation-token");
  if (headerToken) {
    return headerToken;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
};

const runAutomation = async (target: string) => {
  try {
    if (target === "no-response") {
      const result = await runNoResponseAutomation();
      return NextResponse.json({ ok: true, target, result }, { status: 200 });
    }

    if (target === "sla-close") {
      const result = await runSlaCloseAutomation();
      return NextResponse.json({ ok: true, target, result }, { status: 200 });
    }

    const [noResponse, slaClose] = await Promise.all([
      runNoResponseAutomation(),
      runSlaCloseAutomation(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        target: "all",
        result: {
          noResponse,
          slaClose,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo ejecutar automatización",
      },
      { status: 500 }
    );
  }
};

export async function GET(request: NextRequest) {
  const configuredToken = process.env.CRON_SECRET ?? process.env.AUTOMATIONS_RUN_TOKEN;
  const providedToken = extractToken(request);

  if (configuredToken && providedToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = request.nextUrl.searchParams.get("target") ?? "all";
  return runAutomation(target);
}

export async function POST(request: NextRequest) {
  const tokenAuthorized = hasValidAutomationToken(request);
  const roleAuthorized = tokenAuthorized ? false : await hasAdminSession(request);

  if (!tokenAuthorized && !roleAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = request.nextUrl.searchParams.get("target") ?? "no-response";
  return runAutomation(target);
}