import {
  readPilotSessionIdFromCookie,
  registerPilotSessionRequest,
} from "@/lib/server/pilot-access";

export async function requireAuthorizedCase(request: Request): Promise<
  | { ok: true; caseId: string; sessionId: string }
  | { ok: false; response: Response }
> {
  const sessionId = readPilotSessionIdFromCookie(request.headers.get("cookie"));

  if (!sessionId) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: "Pilot session is required.",
        },
        { status: 401 },
      ),
    };
  }

  const registration = await registerPilotSessionRequest(sessionId);

  if (!registration.ok || !registration.caseId) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error:
            registration.error === "session_rate_limited"
              ? "This pilot session has reached its request limit."
              : "Pilot session is no longer valid.",
        },
        { status: registration.error === "session_rate_limited" ? 429 : 401 },
      ),
    };
  }

  return {
    ok: true,
    caseId: registration.caseId,
    sessionId,
  };
}
