import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildInviteLink,
  generatePilotInviteToken,
  getProductionEnvValidation,
  PRODUCTION_REQUIRED_ENV_NAMES,
} from "@/scripts/poc-deploy-utils.mjs";

describe("poc deploy helpers", () => {
  it("flags missing required production env vars and default invite tokens", () => {
    const result = getProductionEnvValidation({
      DATABASE_URL: "postgresql://demo:demo@localhost:5432/admitgenie",
      OPENAI_API_KEY: "sk-test",
      OPENAI_ROUTING_ENABLED: "true",
      OPENAI_CLASSIFIER_MODEL: "gpt-4o-mini",
      OPENAI_RESPONSE_MODEL: "gpt-4o",
      PILOT_FAMILY_INVITE_TOKEN: "admitgenie-family-pilot",
      PILOT_COUNSELOR_INVITE_TOKEN: "",
    });

    expect(result.missing).toContain("PILOT_COUNSELOR_INVITE_TOKEN");
    expect(result.invalid).toContain("PILOT_FAMILY_INVITE_TOKEN");
    expect(result.ok).toBe(false);
  });

  it("accepts a complete production env configuration", () => {
    const result = getProductionEnvValidation({
      DATABASE_URL: "postgresql://demo:demo@localhost:5432/admitgenie",
      OPENAI_API_KEY: "sk-test",
      OPENAI_ROUTING_ENABLED: "true",
      OPENAI_CLASSIFIER_MODEL: "gpt-4o-mini",
      OPENAI_RESPONSE_MODEL: "gpt-4o",
      PILOT_FAMILY_INVITE_TOKEN: "family_super_secure_token_123456789",
      PILOT_COUNSELOR_INVITE_TOKEN: "counselor_super_secure_token_123456789",
      BLOB_READ_WRITE_TOKEN: "",
    });

    expect(result.ok).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
    expect(result.warnings).toContain("BLOB_READ_WRITE_TOKEN is optional and currently unset.");
  });

  it("builds a stable invite link from the deployed base url", () => {
    expect(
      buildInviteLink("https://admit-genie.vercel.app/", "family_super_secure_token"),
    ).toBe(
      "https://admit-genie.vercel.app/?invite=family_super_secure_token",
    );
  });

  it("generates long non-default invite tokens", () => {
    const token = generatePilotInviteToken();

    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(token).not.toBe("admitgenie-family-pilot");
    expect(token).not.toBe("admitgenie-counselor-pilot");
  });

  it("exposes the poc deploy scripts through package.json", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["poc:generate-invites"]).toBe(
      "node scripts/generate-pilot-invites.mjs",
    );
    expect(packageJson.scripts?.["poc:check-env"]).toBe(
      "node scripts/check-poc-env.mjs",
    );
    expect(packageJson.scripts?.["poc:smoke"]).toBe(
      "node scripts/smoke-poc-deploy.mjs",
    );
  });

  it("keeps the required env list stable for production setup", () => {
    expect(PRODUCTION_REQUIRED_ENV_NAMES).toEqual([
      "DATABASE_URL",
      "OPENAI_API_KEY",
      "OPENAI_ROUTING_ENABLED",
      "OPENAI_CLASSIFIER_MODEL",
      "OPENAI_RESPONSE_MODEL",
      "PILOT_FAMILY_INVITE_TOKEN",
      "PILOT_COUNSELOR_INVITE_TOKEN",
    ]);
  });
});
