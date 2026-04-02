import {
  buildPilotSessionCookie,
  grantPilotAccess,
} from "@/lib/server/pilot-access";
import { startNewPlanSession } from "@/lib/server/start-plan";

export async function POST(request: Request) {
  const payload = (await readJson(request)) as {
    inviteToken?: string;
    accessCode?: string;
    action?: string;
  } | null;

  if (payload?.action === "start_new_plan") {
    const grant = await startNewPlanSession();

    return Response.json(
      {
        ok: true,
        data: {
          authorized: true,
          caseId: grant.caseId,
          returnUrl: grant.returnUrl,
        },
      },
      {
        status: 200,
        headers: {
          "set-cookie": buildPilotSessionCookie(grant.sessionId),
        },
      },
    );
  }

  const inviteToken = payload?.inviteToken?.trim() || payload?.accessCode?.trim() || "";

  if (inviteToken.length === 0) {
    return Response.json(
      {
        ok: false,
        error: "Pilot invite is required.",
      },
      { status: 400 },
    );
  }

  const grant = await grantPilotAccess(inviteToken);

  if (!grant) {
    return Response.json(
      {
        ok: false,
        error: "Pilot invite was not recognized.",
      },
      { status: 401 },
    );
  }

  return Response.json(
    {
      ok: true,
      data: {
        authorized: true,
        caseId: grant.caseId,
      },
    },
    {
      status: 200,
      headers: {
        "set-cookie": buildPilotSessionCookie(grant.sessionId),
      },
    },
  );
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
