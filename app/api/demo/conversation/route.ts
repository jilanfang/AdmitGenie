import {
  type DemoConversationSubmission,
} from "@/lib/domain/demo-contracts";
import { getSharedDemoPersistenceAdapter } from "@/lib/server/persistence";

export async function POST(request: Request) {
  const payload = (await readJson(request)) as DemoConversationSubmission | null;

  if (!payload || typeof payload.message !== "string" || payload.message.trim().length === 0) {
    return Response.json(
      {
        ok: false,
        error: "Invalid conversation message.",
      },
      { status: 400 },
    );
  }

  return Response.json({
    ok: true,
    data: await getSharedDemoPersistenceAdapter().submitConversation(payload.message),
  });
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
