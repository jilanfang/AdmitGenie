import { clearDemoAccessCookie } from "@/lib/server/demo-access";

export async function POST() {
  return clearDemoAccessCookie();
}
