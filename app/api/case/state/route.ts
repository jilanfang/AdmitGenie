import { requireAuthorizedCase } from "@/lib/server/case-request";
import { getCaseStateResponseFromPersistence } from "@/lib/server/persistence";

export async function GET(request: Request) {
  const authorized = await requireAuthorizedCase(request);

  if (!authorized.ok) {
    return authorized.response;
  }

  return Response.json({
    ok: true,
    data: await getCaseStateResponseFromPersistence(authorized.caseId),
  });
}
