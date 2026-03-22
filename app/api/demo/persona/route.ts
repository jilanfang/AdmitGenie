import { switchDemoPersonaFromPersistence } from "@/lib/server/persistence";

export async function POST(request: Request) {
  const payload = (await readJson(request)) as { slug?: string } | null;

  if (!payload || typeof payload.slug !== "string" || payload.slug.trim().length === 0) {
    return Response.json(
      {
        ok: false,
        error: "Invalid persona slug.",
      },
      { status: 400 },
    );
  }

  try {
    return Response.json({
      ok: true,
      data: await switchDemoPersonaFromPersistence(payload.slug),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to switch demo persona.";
    const status = /only supported in memory demo mode/i.test(message) ? 409 : 400;

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status },
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
