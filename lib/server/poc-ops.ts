import { createDatabaseConnection } from "@/db";
import { routingEvents } from "@/db/schema";
import type { RoutingMetadata } from "@/lib/server/ai-routing";

export const MATERIAL_CONTENT_LIMIT = 20_000;

export async function logRoutingEvent(args: {
  caseId: string;
  sessionId?: string | null;
  routeType: "conversation" | "material";
  routing: RoutingMetadata;
  errorCategory?: string | null;
}) {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return;
  }

  const db = createDatabaseConnection(databaseUrl);

  await db.insert(routingEvents).values({
    caseId: args.caseId,
    sessionId: args.sessionId ?? null,
    routeType: args.routeType,
    inputKind: args.routing.classification.inputKind,
    responseMode: args.routing.responseMode,
    writeExecuted: args.routing.writeExecuted,
    fallbackReason: args.routing.fallbackReason,
    errorCategory: args.errorCategory ?? null,
    classificationJson: args.routing.classification,
  });
}

export function inferRoutingErrorCategory(routing: RoutingMetadata): string | null {
  if (!routing.fallbackReason) {
    return null;
  }

  if (routing.fallbackReason.includes("classifier")) {
    return "classifier_error";
  }

  if (routing.fallbackReason.includes("responder")) {
    return "responder_error";
  }

  if (routing.fallbackReason.includes("timeout")) {
    return "timeout";
  }

  if (routing.fallbackReason.includes("proposal")) {
    return "proposal_rejected";
  }

  return "fallback";
}
