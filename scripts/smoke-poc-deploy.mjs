import {
  buildInviteLink,
  readSetCookie,
} from "./poc-deploy-utils.mjs";

const baseUrl = String(process.env.PILOT_BASE_URL ?? "").trim();
const familyToken = String(process.env.PILOT_FAMILY_INVITE_TOKEN ?? "").trim();
const counselorToken = String(process.env.PILOT_COUNSELOR_INVITE_TOKEN ?? "").trim();

if (!baseUrl || !familyToken || !counselorToken) {
  console.error(
    "PILOT_BASE_URL, PILOT_FAMILY_INVITE_TOKEN, and PILOT_COUNSELOR_INVITE_TOKEN are required.",
  );
  process.exit(1);
}

await assertReadiness(baseUrl);
await assertUnauthorizedCaseState(baseUrl);
await assertPilotFlow(baseUrl, "family", familyToken);
await assertPilotFlow(baseUrl, "counselor", counselorToken);

console.log("External POC smoke check passed.");

async function assertReadiness(base) {
  const response = await fetch(new URL("/api/case/readiness", ensureBaseUrl(base)));
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Readiness failed with status ${response.status}.`);
  }

  if (!json?.data?.databaseReady || !json?.data?.openAiConfigured || !json?.data?.durableMode) {
    throw new Error("Readiness route did not report a durable, OpenAI-ready deployment.");
  }
}

async function assertUnauthorizedCaseState(base) {
  const response = await fetch(new URL("/api/case/state", ensureBaseUrl(base)));

  if (response.status !== 401) {
    throw new Error(`Expected unauthorized case state to return 401, got ${response.status}.`);
  }
}

async function assertPilotFlow(base, audience, inviteToken) {
  const accessResponse = await fetch(new URL("/api/session/access", ensureBaseUrl(base)), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      inviteToken,
    }),
  });

  if (!accessResponse.ok) {
    throw new Error(`${audience} access failed with status ${accessResponse.status}.`);
  }

  const sessionCookie = readSetCookie(accessResponse);

  if (!sessionCookie) {
    throw new Error(`${audience} access did not return a pilot session cookie.`);
  }

  const stateResponse = await fetch(new URL("/api/case/state", ensureBaseUrl(base)), {
    headers: {
      cookie: sessionCookie,
    },
  });
  const stateJson = await stateResponse.json();

  if (!stateResponse.ok || stateJson?.ok !== true) {
    throw new Error(`${audience} case state could not be loaded after invite access.`);
  }

  const conversationResponse = await fetch(new URL("/api/case/conversation", ensureBaseUrl(base)), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      message: `Smoke check from ${audience} invite flow.`,
    }),
  });

  if (!conversationResponse.ok) {
    throw new Error(`${audience} conversation smoke check failed with status ${conversationResponse.status}.`);
  }

  const materialResponse = await fetch(new URL("/api/case/materials", ensureBaseUrl(base)), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      draft: {
        type: "freeform_note",
        title: `${audience} smoke note`,
        content: `Smoke check note for ${audience} pilot flow.`,
      },
    }),
  });

  if (!materialResponse.ok) {
    throw new Error(`${audience} material smoke check failed with status ${materialResponse.status}.`);
  }

  console.log(`${audience}: ok (${buildInviteLink(base, inviteToken)})`);
}

function ensureBaseUrl(base) {
  return `${String(base).trim().replace(/\/+$/, "")}/`;
}
