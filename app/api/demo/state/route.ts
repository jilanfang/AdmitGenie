import { getDemoStateResponseFromPersistence } from "@/lib/server/persistence";

export async function GET() {
  return Response.json({
    ok: true,
    data: await getDemoStateResponseFromPersistence(),
  });
}
