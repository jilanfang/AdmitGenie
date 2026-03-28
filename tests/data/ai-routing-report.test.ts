import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  generateJourneyRoutingReport,
  loadJourneyScenarios,
  loadRoutingCorpus,
} from "@/tests/helpers/ai-routing-report";

describe("ai routing report", () => {
  it("keeps a broad english routing corpus with journey coverage", () => {
    const rows = loadRoutingCorpus();

    expect(rows.length).toBeGreaterThanOrEqual(80);
    expect(new Set(rows.map((row) => row.journey))).toEqual(
      new Set([
        "Journey 1",
        "Journey 2",
        "Journey 3",
        "Journey 4",
        "Journey 5",
        "Journey 6",
        "Journey 7",
        "Journey 8",
        "Journey 9",
      ]),
    );
    expect(new Set(rows.map((row) => row.persona)).size).toBeGreaterThanOrEqual(5);
  });

  it("materializes a markdown report from stateful journey scenarios", async () => {
    const scenarios = loadJourneyScenarios();
    const reportPath = await generateJourneyRoutingReport(scenarios);

    expect(scenarios.length).toBeGreaterThanOrEqual(10);
    expect(existsSync(reportPath)).toBe(true);

    const report = readFileSync(reportPath, "utf8");

    expect(reportPath).toBe(join(process.cwd(), "output/ai-routing/journey-report.md"));
    expect(report).toContain("# AdmitGenie Journey Routing Report");
    expect(report).toMatch(/Pass rate/i);
    expect(report).toMatch(/Journey 1/i);
    expect(report).toMatch(/Journey 9/i);
  });
});
