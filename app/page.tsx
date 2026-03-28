import { cookies } from "next/headers";

import { CoachShell } from "@/components/coach-shell";
import { DemoAccessGate } from "@/components/demo-access-gate";
import { getPilotSessionCookieName } from "@/lib/server/pilot-access";

export default async function HomePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const searchParams = (await props.searchParams) ?? {};
  const inviteToken = typeof searchParams.invite === "string" ? searchParams.invite : null;
  const hasAccess = Boolean(cookieStore.get(getPilotSessionCookieName())?.value);

  if (!hasAccess) {
    return <DemoAccessGate initialInviteToken={inviteToken} />;
  }

  return <CoachShell />;
}
