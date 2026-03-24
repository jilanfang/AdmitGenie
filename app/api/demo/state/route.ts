import { getDemoStateResponseFromPersistence } from "@/lib/server/persistence";

export async function GET(request: Request) {
  return Response.json({
    ok: true,
    data: await getDemoStateResponseFromPersistence(
      new URL(request.url).searchParams.get("workspace") ?? undefined,
    ),
  });
}
