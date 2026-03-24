import { cookies } from "next/headers";

import { CoachShell } from "@/components/coach-shell";
import { DemoAccessGate } from "@/components/demo-access-gate";
import { getDemoAccessCookieName } from "@/lib/server/demo-access";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get(getDemoAccessCookieName())?.value === "granted";

  if (!hasAccess) {
    return <DemoAccessGate />;
  }

  return <CoachShell />;
}
