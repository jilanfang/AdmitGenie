import { readFileSync } from "node:fs";
import path from "node:path";

describe("package scripts", () => {
  it("uses webpack for the production build path", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.build).toBe("next build --webpack");
  });
});
