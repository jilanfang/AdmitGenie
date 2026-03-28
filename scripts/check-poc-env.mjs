import { getProductionEnvValidation } from "./poc-deploy-utils.mjs";

const result = getProductionEnvValidation(process.env);

if (result.ok) {
  console.log("Production POC env looks ready.");
} else {
  console.error("Production POC env is not ready.");
}

if (result.missing.length > 0) {
  console.error(`Missing: ${result.missing.join(", ")}`);
}

if (result.invalid.length > 0) {
  console.error(`Invalid: ${Array.from(new Set(result.invalid)).join(", ")}`);
}

for (const warning of result.warnings) {
  console.warn(`Warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);

