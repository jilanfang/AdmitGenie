import { buildGrantedDemoAccessCookie, isValidDemoAccessCode } from "@/lib/server/demo-access";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    accessCode?: string;
  };
  const accessCode = payload.accessCode?.trim() ?? "";

  if (!isValidDemoAccessCode(accessCode)) {
    return Response.json(
      {
        ok: false,
        error: "Invalid demo access code.",
      },
      {
        status: 401,
      },
    );
  }

  return Response.json(
    {
      ok: true,
      data: {
        authorized: true,
      },
    },
    {
      status: 200,
      headers: {
        "set-cookie": buildGrantedDemoAccessCookie(),
      },
    },
  );
}
