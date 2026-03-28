import {
  buildInviteLink,
  formatEnvAssignment,
  generatePilotInviteToken,
} from "./poc-deploy-utils.mjs";

const familyToken = generatePilotInviteToken();
const counselorToken = generatePilotInviteToken();
const baseUrl = String(process.env.PILOT_BASE_URL ?? "").trim();

console.log("# Paste these into Vercel Production environment variables");
console.log(formatEnvAssignment("PILOT_FAMILY_INVITE_TOKEN", familyToken));
console.log(formatEnvAssignment("PILOT_COUNSELOR_INVITE_TOKEN", counselorToken));

if (baseUrl) {
  console.log("");
  console.log("# Invite links");
  console.log(`family=${buildInviteLink(baseUrl, familyToken)}`);
  console.log(`counselor=${buildInviteLink(baseUrl, counselorToken)}`);
}

