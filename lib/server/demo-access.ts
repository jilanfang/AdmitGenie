const DEMO_ACCESS_COOKIE = "admitgenie-demo-access";
const DEMO_ACCESS_GRANTED = "granted";
const DEFAULT_DEMO_ACCESS_CODE = "admitgenie-demo";

export function getDemoAccessCookieName(): string {
  return DEMO_ACCESS_COOKIE;
}

export function getExpectedDemoAccessCode(): string {
  const configured = process.env.DEMO_ACCESS_CODE?.trim();

  return configured && configured.length > 0 ? configured : DEFAULT_DEMO_ACCESS_CODE;
}

export function isValidDemoAccessCode(accessCode: string): boolean {
  return accessCode.trim() === getExpectedDemoAccessCode();
}

export function hasDemoAccess(cookieHeader?: string | null): boolean {
  if (!cookieHeader) {
    return false;
  }

  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .some((chunk) => chunk === `${DEMO_ACCESS_COOKIE}=${DEMO_ACCESS_GRANTED}`);
}

export function buildGrantedDemoAccessCookie(): string {
  return `${DEMO_ACCESS_COOKIE}=${DEMO_ACCESS_GRANTED}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function clearDemoAccessCookie(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      "set-cookie": `${DEMO_ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}
