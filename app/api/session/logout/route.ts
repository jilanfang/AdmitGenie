import { clearPilotSessionCookie } from "@/lib/server/pilot-access";

export async function POST() {
  return clearPilotSessionCookie();
}
