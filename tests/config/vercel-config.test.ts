import { readFileSync } from "node:fs";
import path from "node:path";

describe("vercel deployment config", () => {
  it("pins Vercel to the verified pnpm build path", () => {
    const vercelConfigPath = path.join(process.cwd(), "vercel.json");
    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
      framework?: string;
      installCommand?: string;
      buildCommand?: string;
    };

    expect(vercelConfig.framework).toBe("nextjs");
    expect(vercelConfig.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(vercelConfig.buildCommand).toBe("pnpm build");
  });
});
