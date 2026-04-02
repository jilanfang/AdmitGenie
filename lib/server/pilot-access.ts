import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { createDatabaseConnection } from "@/db";
import {
  pilotCases,
  pilotInvites,
  pilotSessions,
} from "@/db/schema";
import { DEFAULT_PERSONA_SLUG } from "@/lib/domain/personas";

export type PilotAudience = "family" | "counselor" | "private";

export type PilotCaseSeed = {
  caseId: string;
  slug: string;
  audience: PilotAudience;
  displayName: string;
  summary: string;
  personaSlug: string;
  inviteLabel: string;
  inviteToken: string;
};

export type PilotInviteGrant = {
  sessionId: string;
  caseId: string;
};

export type PilotSessionState = {
  id: string;
  caseId: string;
  requestCount: number;
};

const PILOT_SESSION_COOKIE = "admitgenie-pilot-session";
const MAX_SESSION_REQUESTS = 120;
const PRIVATE_CASE_DISPLAY_NAME = "New admissions plan";
const PRIVATE_CASE_SUMMARY = "A blank private case that will be shaped through conversation.";
const PRIVATE_CASE_INVITE_LABEL = "Private return link";
const PRIVATE_CASE_ID_PREFIX = "private-case-";
const PRIVATE_INVITE_PREFIX = "private-access-";

const memorySessions = new Map<string, PilotSessionState>();
const memoryPrivateCases = new Map<string, PilotCaseSeed>();
const memoryPrivateInvites = new Map<string, PilotCaseSeed>();

export function getPilotSessionCookieName(): string {
  return PILOT_SESSION_COOKIE;
}

export function buildPilotSessionCookie(sessionId: string): string {
  return `${PILOT_SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function clearPilotSessionCookie(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      "set-cookie": `${PILOT_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}

export function readPilotSessionIdFromCookie(cookieHeader?: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PILOT_SESSION_COOKIE}=`));

  if (!match) {
    return null;
  }

  const [, value = ""] = match.split("=");
  return value.trim().length > 0 ? value.trim() : null;
}

export function listPilotCaseSeeds(): PilotCaseSeed[] {
  return [
    {
      caseId: "pilot-family-case",
      slug: "ava-chen-family",
      audience: "family",
      displayName: "Ava Chen",
      summary:
        "11th-grade engineering applicant with strong academics, but the family still needs a sharper list, testing baseline, and affordability-aware plan.",
      personaSlug: "strategic-stem-striver",
      inviteLabel: "Family pilot invite",
      inviteToken: process.env.PILOT_FAMILY_INVITE_TOKEN?.trim() || "admitgenie-family-pilot",
    },
    {
      caseId: "pilot-counselor-case",
      slug: "maya-johnson-case",
      audience: "counselor",
      displayName: "Maya Johnson",
      summary:
        "Counselor-managed first-generation admissions case focused on affordability, shortlist discipline, and execution follow-through.",
      personaSlug: "first-gen-ambition-builder",
      inviteLabel: "Counselor pilot invite",
      inviteToken:
        process.env.PILOT_COUNSELOR_INVITE_TOKEN?.trim() || "admitgenie-counselor-pilot",
    },
  ];
}

function createPrivateCaseSeed(caseId: string, inviteToken?: string): PilotCaseSeed {
  const suffix = caseId.startsWith(PRIVATE_CASE_ID_PREFIX)
    ? caseId.slice(PRIVATE_CASE_ID_PREFIX.length)
    : caseId;

  return {
    caseId,
    slug: caseId,
    audience: "private",
    displayName: PRIVATE_CASE_DISPLAY_NAME,
    summary: PRIVATE_CASE_SUMMARY,
    personaSlug: DEFAULT_PERSONA_SLUG,
    inviteLabel: PRIVATE_CASE_INVITE_LABEL,
    inviteToken: inviteToken ?? `${PRIVATE_INVITE_PREFIX}${suffix}`,
  };
}

export function getPilotCaseSeed(caseId?: string): PilotCaseSeed {
  if (caseId) {
    const privateSeed = memoryPrivateCases.get(caseId);

    if (privateSeed) {
      return privateSeed;
    }

    if (caseId.startsWith(PRIVATE_CASE_ID_PREFIX)) {
      return createPrivateCaseSeed(caseId);
    }
  }

  const seeds = listPilotCaseSeeds();

  if (!caseId) {
    return seeds[0];
  }

  return seeds.find((seed) => seed.caseId === caseId) ?? seeds[0];
}

export function getPilotCaseSeedByInviteToken(inviteToken: string): PilotCaseSeed | null {
  const trimmed = inviteToken.trim();

  if (trimmed.startsWith(PRIVATE_INVITE_PREFIX)) {
    const suffix = trimmed.slice(PRIVATE_INVITE_PREFIX.length);
    return createPrivateCaseSeed(`${PRIVATE_CASE_ID_PREFIX}${suffix}`, trimmed);
  }

  return (
    memoryPrivateInvites.get(trimmed) ??
    listPilotCaseSeeds().find((seed) => seed.inviteToken === trimmed) ??
    null
  );
}

export async function createPrivatePlanAccess(): Promise<{
  sessionId: string;
  caseId: string;
  inviteToken: string;
}> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const caseId = `${PRIVATE_CASE_ID_PREFIX}${suffix}`;
  const inviteToken = `${PRIVATE_INVITE_PREFIX}${suffix}`;
  const seed = createPrivateCaseSeed(caseId, inviteToken);

  if (!databaseUrl) {
    const sessionId = randomUUID();
    memoryPrivateCases.set(caseId, seed);
    memoryPrivateInvites.set(inviteToken, seed);
    memorySessions.set(sessionId, {
      id: sessionId,
      caseId,
      requestCount: 0,
    });

    return {
      sessionId,
      caseId,
      inviteToken,
    };
  }

  const db = createDatabaseConnection(databaseUrl);
  await ensurePilotSeeds(databaseUrl);

  await db.insert(pilotCases).values({
    id: seed.caseId,
    slug: seed.slug,
    audience: seed.audience,
    displayName: seed.displayName,
    summary: seed.summary,
    personaSlug: seed.personaSlug,
  });

  const [invite] = await db
    .insert(pilotInvites)
    .values({
      caseId: seed.caseId,
      label: seed.inviteLabel,
      token: seed.inviteToken,
      status: "active",
    })
    .returning();

  const [session] = await db
    .insert(pilotSessions)
    .values({
      caseId: seed.caseId,
      inviteId: invite.id,
      requestCount: 0,
    })
    .returning();

  return {
    sessionId: session.id,
    caseId: seed.caseId,
    inviteToken: seed.inviteToken,
  };
}

export async function grantPilotAccess(inviteToken: string): Promise<PilotInviteGrant | null> {
  const trimmed = inviteToken.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    const seed = getPilotCaseSeedByInviteToken(trimmed);

    if (!seed) {
      return null;
    }

    const sessionId = randomUUID();
    memorySessions.set(sessionId, {
      id: sessionId,
      caseId: seed.caseId,
      requestCount: 0,
    });

    return {
      sessionId,
      caseId: seed.caseId,
    };
  }

  const db = createDatabaseConnection(databaseUrl);
  await ensurePilotSeeds(databaseUrl);

  const [invite] = await db
    .select()
    .from(pilotInvites)
    .where(and(eq(pilotInvites.token, trimmed), eq(pilotInvites.status, "active")))
    .limit(1);

  if (!invite) {
    return null;
  }

  const [session] = await db
    .insert(pilotSessions)
    .values({
      caseId: invite.caseId,
      inviteId: invite.id,
      requestCount: 0,
    })
    .returning();

  return {
    sessionId: session.id,
    caseId: invite.caseId,
  };
}

export async function resolvePilotSession(sessionId: string): Promise<PilotSessionState | null> {
  const trimmed = sessionId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return memorySessions.get(trimmed) ?? null;
  }

  const db = createDatabaseConnection(databaseUrl);
  const [session] = await db
    .select()
    .from(pilotSessions)
    .where(eq(pilotSessions.id, trimmed))
    .limit(1);

  return session
    ? {
        id: session.id,
        caseId: session.caseId,
        requestCount: session.requestCount,
      }
    : null;
}

export async function registerPilotSessionRequest(sessionId: string): Promise<{
  ok: boolean;
  caseId?: string;
  error?: string;
}> {
  const session = await resolvePilotSession(sessionId);

  if (!session) {
    return {
      ok: false,
      error: "invalid_session",
    };
  }

  if (session.requestCount >= MAX_SESSION_REQUESTS) {
    return {
      ok: false,
      error: "session_rate_limited",
    };
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    memorySessions.set(sessionId, {
      ...session,
      requestCount: session.requestCount + 1,
    });
  } else {
    const db = createDatabaseConnection(databaseUrl);
    await db
      .update(pilotSessions)
      .set({
        requestCount: session.requestCount + 1,
        lastSeenAt: new Date(),
      })
      .where(eq(pilotSessions.id, sessionId));
  }

  return {
    ok: true,
    caseId: session.caseId,
  };
}

export async function ensurePilotSeeds(databaseUrl: string) {
  const db = createDatabaseConnection(databaseUrl);
  const seeds = listPilotCaseSeeds();

  for (const seed of seeds) {
    const [existingCase] = await db
      .select({ id: pilotCases.id })
      .from(pilotCases)
      .where(eq(pilotCases.id, seed.caseId))
      .limit(1);

    if (!existingCase) {
      await db.insert(pilotCases).values({
        id: seed.caseId,
        slug: seed.slug,
        audience: seed.audience,
        displayName: seed.displayName,
        summary: seed.summary,
        personaSlug: seed.personaSlug,
      });
    }

    const [existingInvite] = await db
      .select({ id: pilotInvites.id })
      .from(pilotInvites)
      .where(eq(pilotInvites.token, seed.inviteToken))
      .limit(1);

    if (!existingInvite) {
      await db.insert(pilotInvites).values({
        caseId: seed.caseId,
        label: seed.inviteLabel,
        token: seed.inviteToken,
        status: "active",
      });
    }
  }
}

export function getPilotAccessDefaults() {
  return {
    maxSessionRequests: MAX_SESSION_REQUESTS,
  };
}
