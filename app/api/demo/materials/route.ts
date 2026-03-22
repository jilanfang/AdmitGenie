import {
  isMaterialDraft,
  type DemoMaterialSubmission,
} from "@/lib/domain/demo-contracts";
import { getSharedDemoPersistenceAdapter } from "@/lib/server/persistence";

export async function POST(request: Request) {
  const payload = (await readJson(request)) as DemoMaterialSubmission | null;

  if (!payload || !isMaterialDraft(payload.draft)) {
    return Response.json(
      {
        ok: false,
        error: "Invalid material draft.",
      },
      { status: 400 },
    );
  }

  return Response.json({
    ok: true,
    data: await getSharedDemoPersistenceAdapter().submitMaterial(payload.draft),
  });
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
