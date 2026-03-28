import { runJourneyScenarios } from "@/tests/helpers/ai-routing-report";

describe("journey scenarios", () => {
  it("replays english customer journeys through the demo api", async () => {
    const result = await runJourneyScenarios();

    expect(result.summary.totalScenarios).toBeGreaterThanOrEqual(10);
    expect(result.summary.failedScenarios).toBe(0);
    expect(result.summary.totalSteps).toBeGreaterThan(20);
    expect(result.summary.failedSteps).toBe(0);
  });
});
