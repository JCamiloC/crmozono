import { NextResponse, type NextRequest } from "next/server";
import { runNoResponseAutomation } from "../../../../services/automations/no-response.service";
import { runSlaCloseAutomation } from "../../../../services/automations/sla-close.service";

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
  const target = request.nextUrl.searchParams.get("target") ?? "no-response";
  return runAutomation(target);
}