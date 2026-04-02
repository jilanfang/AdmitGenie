import { requireAuthorizedCase } from "@/lib/server/case-request";
import {
  getSharedDemoPersistenceAdapter,
} from "@/lib/server/persistence";
import { inferRoutingErrorCategory, logRoutingEvent } from "@/lib/server/poc-ops";

export async function POST(request: Request) {
  try {
    const authorized = await requireAuthorizedCase(request);

    if (!authorized.ok) {
      return authorized.response;
    }

    const payload = (await readJson(request)) as { message?: string } | null;

    if (!payload || typeof payload.message !== "string" || payload.message.trim().length === 0) {
      return Response.json(
        {
          ok: false,
          error: "Invalid conversation message.",
        },
        { status: 400 },
      );
    }

    const data = await getSharedDemoPersistenceAdapter().submitConversation(
      payload.message,
      authorized.caseId,
    );

    await logRoutingEvent({
      caseId: authorized.caseId,
      sessionId: authorized.sessionId,
      routeType: "conversation",
      routing: data.routing,
      errorCategory: inferRoutingErrorCategory(data.routing),
    });

    return Response.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("case conversation route failed", error);

    return Response.json(
      {
        ok: false,
        error: "We could not process that message right now. Please try again.",
      },
      { status: 500 },
    );
  }
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
