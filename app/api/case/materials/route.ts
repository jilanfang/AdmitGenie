import { isMaterialDraft } from "@/lib/domain/demo-contracts";
import { requireAuthorizedCase } from "@/lib/server/case-request";
import { getSharedDemoPersistenceAdapter } from "@/lib/server/persistence";
import {
  inferRoutingErrorCategory,
  logRoutingEvent,
  MATERIAL_CONTENT_LIMIT,
} from "@/lib/server/poc-ops";

export async function POST(request: Request) {
  try {
    const authorized = await requireAuthorizedCase(request);

    if (!authorized.ok) {
      return authorized.response;
    }

    const payload = (await readJson(request)) as { draft?: unknown } | null;

    if (!payload || !isMaterialDraft(payload.draft)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid material draft.",
        },
        { status: 400 },
      );
    }

    if (payload.draft.content.trim().length > MATERIAL_CONTENT_LIMIT) {
      return Response.json(
        {
          ok: false,
          error: "Material is too large for this pilot upload path. Please shorten it or split it.",
        },
        { status: 413 },
      );
    }

    const data = await getSharedDemoPersistenceAdapter().submitMaterial(
      payload.draft,
      authorized.caseId,
    );

    await logRoutingEvent({
      caseId: authorized.caseId,
      sessionId: authorized.sessionId,
      routeType: "material",
      routing: data.routing,
      errorCategory: inferRoutingErrorCategory(data.routing),
    });

    return Response.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("case materials route failed", error);

    return Response.json(
      {
        ok: false,
        error: "We could not process that material right now. Please try again.",
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
