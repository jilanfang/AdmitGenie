import { createPrivatePlanAccess } from "@/lib/server/pilot-access";

export function buildPrivateReturnUrl(inviteToken: string): string {
  return `/?invite=${encodeURIComponent(inviteToken)}&entry=private`;
}

export async function startNewPlanSession() {
  const grant = await createPrivatePlanAccess();

  return {
    ...grant,
    returnUrl: buildPrivateReturnUrl(grant.inviteToken),
  };
}
