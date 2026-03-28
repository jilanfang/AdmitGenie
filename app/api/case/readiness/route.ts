import { getCaseReadinessStatus } from "@/lib/server/persistence";

export async function GET() {
  return Response.json({
    ok: true,
    data: getCaseReadinessStatus(),
  });
}
