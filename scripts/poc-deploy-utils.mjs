import { randomBytes } from "node:crypto";

export const DEFAULT_INVITE_TOKENS = new Set([
  "admitgenie-family-pilot",
  "admitgenie-counselor-pilot",
]);

export const PRODUCTION_REQUIRED_ENV_NAMES = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_ROUTING_ENABLED",
  "OPENAI_CLASSIFIER_MODEL",
  "OPENAI_RESPONSE_MODEL",
  "PILOT_FAMILY_INVITE_TOKEN",
  "PILOT_COUNSELOR_INVITE_TOKEN",
];

export function generatePilotInviteToken(length = 24) {
  return randomBytes(length).toString("base64url");
}

export function buildInviteLink(baseUrl, inviteToken) {
  const normalizedBaseUrl = String(baseUrl).trim().replace(/\/+$/, "");
  const normalizedInvite = String(inviteToken).trim();

  if (!normalizedBaseUrl) {
    throw new Error("PILOT_BASE_URL is required to build invite links.");
  }

  if (!normalizedInvite) {
    throw new Error("Invite token is required to build invite links.");
  }

  const url = new URL(`${normalizedBaseUrl}/`);
  url.searchParams.set("invite", normalizedInvite);
  return url.toString();
}

export function getProductionEnvValidation(env) {
  const missing = [];
  const invalid = [];
  const warnings = [];

  for (const name of PRODUCTION_REQUIRED_ENV_NAMES) {
    if (!String(env[name] ?? "").trim()) {
      missing.push(name);
    }
  }

  const familyToken = String(env.PILOT_FAMILY_INVITE_TOKEN ?? "").trim();
  const counselorToken = String(env.PILOT_COUNSELOR_INVITE_TOKEN ?? "").trim();

  if (familyToken && DEFAULT_INVITE_TOKENS.has(familyToken)) {
    invalid.push("PILOT_FAMILY_INVITE_TOKEN");
  }

  if (counselorToken && DEFAULT_INVITE_TOKENS.has(counselorToken)) {
    invalid.push("PILOT_COUNSELOR_INVITE_TOKEN");
  }

  if (String(env.OPENAI_ROUTING_ENABLED ?? "").trim() !== "true") {
    invalid.push("OPENAI_ROUTING_ENABLED");
  }

  if (!String(env.BLOB_READ_WRITE_TOKEN ?? "").trim()) {
    warnings.push("BLOB_READ_WRITE_TOKEN is optional and currently unset.");
  }

  if (familyToken && counselorToken && familyToken === counselorToken) {
    invalid.push("PILOT_COUNSELOR_INVITE_TOKEN");
    warnings.push("Family and counselor invite tokens should not be the same.");
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

export function formatEnvAssignment(name, value) {
  return `${name}=${value}`;
}

export function readSetCookie(response) {
  const header = response.headers.get("set-cookie") ?? response.headers.get("Set-Cookie");
  return header ? header.split(";")[0] : null;
}

