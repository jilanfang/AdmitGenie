import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { POST as postConversation } from "@/app/api/demo/conversation/route";
import { POST as postMaterial } from "@/app/api/demo/materials/route";
import { POST as postPersona } from "@/app/api/demo/persona/route";
import type { DemoState, MaterialDraft } from "@/lib/domain/demo-state";
import { resetDemoPersistenceForTests } from "@/lib/server/persistence";

export type RoutingCorpusRow = {
  journey: string;
  stage: string;
  persona: string;
  channel: "chat" | "material";
  userInput: string;
  expectedInputKind: string;
  expectedResponseMode: string;
  expectedWritePermission: string;
  expectedCardType: string;
  expectedActionProposal: string;
  expectedFallbackBehavior: string;
  expectedDeterministicBehavior?: "match" | "fallback_unknown" | "stateful_only";
};

export type JourneyScenario = {
  id: string;
  journey: string;
  persona: string;
  personaSlug: string;
  steps: JourneyScenarioStep[];
};

export type JourneyScenarioStep = {
  label: string;
  channel: "chat" | "material";
  message?: string;
  draft?: MaterialDraft;
  expectedResponseMode: string;
  expectedWriteExecuted: boolean;
  expectedDecisionCardType?: string | null;
  expectedPendingPatchStatus?: string | null;
  expectedPatchStatus?: string | null;
  expectedReplyIncludes?: string[];
  expectedField?: keyof DemoState["profileFields"];
  expectedFieldStatus?: string;
  expectedFieldValueIncludes?: string[];
  expectedBriefIncludes?: string[];
};

type StepRunResult = {
  label: string;
  passed: boolean;
  issues: string[];
};

type ScenarioRunResult = {
  id: string;
  journey: string;
  persona: string;
  passed: boolean;
  stepResults: StepRunResult[];
};

export type JourneyRunSummary = {
  totalScenarios: number;
  failedScenarios: number;
  totalSteps: number;
  failedSteps: number;
};

export type JourneyRunResult = {
  summary: JourneyRunSummary;
  scenarios: ScenarioRunResult[];
};

const ROUTING_CORPUS_PATH = join(process.cwd(), "tests/fixtures/ai-routing-corpus.jsonl");
const JOURNEY_SCENARIOS_PATH = join(process.cwd(), "tests/fixtures/ai-journey-scenarios.json");
const REPORT_DIRECTORY = join(process.cwd(), "output/ai-routing");
const REPORT_PATH = join(REPORT_DIRECTORY, "journey-report.md");
const REPORT_JSON_PATH = join(REPORT_DIRECTORY, "journey-report.json");

export function loadRoutingCorpus(): RoutingCorpusRow[] {
  const raw = readFileSync(ROUTING_CORPUS_PATH, "utf8");

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as RoutingCorpusRow);
}

export function loadJourneyScenarios(): JourneyScenario[] {
  return JSON.parse(
    readFileSync(JOURNEY_SCENARIOS_PATH, "utf8"),
  ) as JourneyScenario[];
}

export async function runJourneyScenarios(
  scenarios: JourneyScenario[] = loadJourneyScenarios(),
): Promise<JourneyRunResult> {
  const previousRoutingFlag = process.env.OPENAI_ROUTING_ENABLED;
  process.env.OPENAI_ROUTING_ENABLED = "false";

  try {
    const scenarioResults: ScenarioRunResult[] = [];

    for (const scenario of scenarios) {
      resetDemoPersistenceForTests();
      const workspace = `journey-${scenario.id}`;
      await selectPersonaForWorkspace(scenario.personaSlug, workspace);

      const stepResults: StepRunResult[] = [];

      for (const step of scenario.steps) {
        const data = await submitScenarioStep(step, workspace);
        const evaluation = evaluateScenarioStep(step, data);
        stepResults.push({
          label: step.label,
          passed: evaluation.length === 0,
          issues: evaluation,
        });
      }

      scenarioResults.push({
        id: scenario.id,
        journey: scenario.journey,
        persona: scenario.persona,
        passed: stepResults.every((step) => step.passed),
        stepResults,
      });
    }

    const totalSteps = scenarioResults.reduce(
      (sum, scenario) => sum + scenario.stepResults.length,
      0,
    );
    const failedSteps = scenarioResults.reduce(
      (sum, scenario) => sum + scenario.stepResults.filter((step) => !step.passed).length,
      0,
    );

    return {
      summary: {
        totalScenarios: scenarioResults.length,
        failedScenarios: scenarioResults.filter((scenario) => !scenario.passed).length,
        totalSteps,
        failedSteps,
      },
      scenarios: scenarioResults,
    };
  } finally {
    process.env.OPENAI_ROUTING_ENABLED = previousRoutingFlag;
  }
}

export async function generateJourneyRoutingReport(
  scenarios: JourneyScenario[] = loadJourneyScenarios(),
): Promise<string> {
  const corpus = loadRoutingCorpus();
  const journeyRun = await runJourneyScenarios(scenarios);
  const markdown = buildJourneyRoutingReport(corpus, journeyRun);

  mkdirSync(REPORT_DIRECTORY, { recursive: true });
  writeFileSync(REPORT_PATH, markdown, "utf8");
  writeFileSync(
    REPORT_JSON_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        corpusSummary: buildCorpusSummary(corpus),
        journeyRun,
      },
      null,
      2,
    ),
    "utf8",
  );

  return REPORT_PATH;
}

async function selectPersonaForWorkspace(personaSlug: string, workspace: string) {
  if (personaSlug === "strategic-stem-striver") {
    return;
  }

  await postPersona(
    new Request(`http://localhost/api/demo/persona?workspace=${workspace}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        slug: personaSlug,
      }),
    }),
  );
}

async function submitScenarioStep(step: JourneyScenarioStep, workspace: string) {
  const response =
    step.channel === "chat"
      ? await postConversation(
          new Request(`http://localhost/api/demo/conversation?workspace=${workspace}`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              message: step.message,
            }),
          }),
        )
      : await postMaterial(
          new Request(`http://localhost/api/demo/materials?workspace=${workspace}`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              draft: step.draft,
            }),
          }),
        );

  return {
    status: response.status,
    json: (await response.json()) as {
      ok: boolean;
      data: {
        reply?: {
          content: string;
        };
        latestPatch?: {
          status: string;
        } | null;
        state: {
          pendingPatch: {
            status: string;
          } | null;
          decisionCard: {
            type: string;
          } | null;
          weeklyBrief: {
            whatChanged: string;
            whatMatters: string;
            topActions: string[];
          };
          profileFields: DemoState["profileFields"];
        };
        routing: {
          responseMode: string;
          writeExecuted: boolean;
        };
      };
    },
  };
}

function evaluateScenarioStep(
  step: JourneyScenarioStep,
  payload: Awaited<ReturnType<typeof submitScenarioStep>>,
): string[] {
  const issues: string[] = [];

  if (payload.status !== 200 || payload.json.ok !== true) {
    issues.push(`expected status 200 and ok=true, got status=${payload.status}`);
    return issues;
  }

  const data = payload.json.data;

  if (data.routing.responseMode !== step.expectedResponseMode) {
    issues.push(
      `expected responseMode=${step.expectedResponseMode}, got ${data.routing.responseMode}`,
    );
  }

  if (data.routing.writeExecuted !== step.expectedWriteExecuted) {
    issues.push(
      `expected writeExecuted=${String(step.expectedWriteExecuted)}, got ${String(data.routing.writeExecuted)}`,
    );
  }

  if (step.expectedDecisionCardType !== undefined) {
    const actualDecisionCardType = data.state.decisionCard?.type ?? null;
    if (actualDecisionCardType !== step.expectedDecisionCardType) {
      issues.push(
        `expected decisionCard=${String(step.expectedDecisionCardType)}, got ${String(actualDecisionCardType)}`,
      );
    }
  }

  if (step.expectedPendingPatchStatus !== undefined) {
    const actualPendingStatus = data.state.pendingPatch?.status ?? null;
    if (actualPendingStatus !== step.expectedPendingPatchStatus) {
      issues.push(
        `expected pendingPatch=${String(step.expectedPendingPatchStatus)}, got ${String(actualPendingStatus)}`,
      );
    }
  }

  if (step.expectedPatchStatus !== undefined) {
    const actualPatchStatus = data.latestPatch?.status ?? null;
    if (actualPatchStatus !== step.expectedPatchStatus) {
      issues.push(
        `expected latestPatch=${String(step.expectedPatchStatus)}, got ${String(actualPatchStatus)}`,
      );
    }
  }

  if (step.expectedReplyIncludes && step.expectedReplyIncludes.length > 0) {
    const replyText = normalizeText(data.reply?.content ?? "");

    for (const expectedPhrase of step.expectedReplyIncludes) {
      if (!replyText.includes(normalizeText(expectedPhrase))) {
        issues.push(`expected reply to include "${expectedPhrase}"`);
      }
    }
  }

  if (step.expectedField) {
    const field = data.state.profileFields[step.expectedField];

    if (step.expectedFieldStatus && field.status !== step.expectedFieldStatus) {
      issues.push(
        `expected ${step.expectedField} status=${step.expectedFieldStatus}, got ${field.status}`,
      );
    }

    if (step.expectedFieldValueIncludes) {
      const fieldValue = normalizeText(field.value);

      for (const expectedPhrase of step.expectedFieldValueIncludes) {
        if (!fieldValue.includes(normalizeText(expectedPhrase))) {
          issues.push(`expected ${step.expectedField} to include "${expectedPhrase}"`);
        }
      }
    }
  }

  if (step.expectedBriefIncludes && step.expectedBriefIncludes.length > 0) {
    const briefText = normalizeText(
      [
        data.state.weeklyBrief.whatChanged,
        data.state.weeklyBrief.whatMatters,
        data.state.weeklyBrief.topActions.join(" "),
      ].join(" "),
    );

    for (const expectedPhrase of step.expectedBriefIncludes) {
      if (!briefText.includes(normalizeText(expectedPhrase))) {
        issues.push(`expected weeklyBrief to include "${expectedPhrase}"`);
      }
    }
  }

  return issues;
}

function buildJourneyRoutingReport(
  corpus: RoutingCorpusRow[],
  journeyRun: JourneyRunResult,
): string {
  const corpusSummary = buildCorpusSummary(corpus);
  const scenarioPassRate = formatRate(
    journeyRun.summary.totalScenarios - journeyRun.summary.failedScenarios,
    journeyRun.summary.totalScenarios,
  );
  const stepPassRate = formatRate(
    journeyRun.summary.totalSteps - journeyRun.summary.failedSteps,
    journeyRun.summary.totalSteps,
  );

  const scenarioLines = journeyRun.scenarios
    .map((scenario) => {
      const failedSteps = scenario.stepResults.filter((step) => !step.passed);
      return `| ${scenario.id} | ${scenario.journey} | ${scenario.persona} | ${scenario.stepResults.length} | ${scenario.passed ? "PASS" : "FAIL"} | ${failedSteps.length === 0 ? "None" : failedSteps.map((step) => step.label).join(", ")} |`;
    })
    .join("\n");

  const failureLines = journeyRun.scenarios
    .flatMap((scenario) =>
      scenario.stepResults
        .filter((step) => !step.passed)
        .map(
          (step) =>
            `- ${scenario.id} / ${step.label}: ${step.issues.join("; ")}`,
        ),
    )
    .join("\n");

  return [
    "# AdmitGenie Journey Routing Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Corpus Coverage",
    `- Total rows: ${corpus.length}`,
    `- Journeys covered: ${corpusSummary.journeys.join(", ")}`,
    `- Personas covered: ${corpusSummary.personas.join(", ")}`,
    `- Response modes covered: ${corpusSummary.responseModes.join(", ")}`,
    `- Deterministic match rows: ${corpusSummary.deterministic.match}`,
    `- Deterministic fallback rows: ${corpusSummary.deterministic.fallbackUnknown}`,
    `- Stateful-only rows: ${corpusSummary.deterministic.statefulOnly}`,
    "",
    "## Stateful Journey Regression",
    `- Scenario pass rate: ${scenarioPassRate}`,
    `- Step pass rate: ${stepPassRate}`,
    "",
    "| Scenario | Journey | Persona | Steps | Status | Failed steps |",
    "| --- | --- | --- | ---: | --- | --- |",
    scenarioLines,
    "",
    "## Failures",
    failureLines.length > 0 ? failureLines : "- None",
    "",
  ].join("\n");
}

function buildCorpusSummary(corpus: RoutingCorpusRow[]) {
  const journeys = [...new Set(corpus.map((row) => row.journey))].sort();
  const personas = [...new Set(corpus.map((row) => row.persona))].sort();
  const responseModes = [...new Set(corpus.map((row) => row.expectedResponseMode))].sort();

  return {
    journeys,
    personas,
    responseModes,
    deterministic: {
      match: corpus.filter(
        (row) =>
          row.expectedDeterministicBehavior === "match" ||
          (row.expectedDeterministicBehavior === undefined &&
            row.expectedFallbackBehavior === "none"),
      ).length,
      fallbackUnknown: corpus.filter(
        (row) =>
          row.expectedDeterministicBehavior === "fallback_unknown" ||
          (row.expectedDeterministicBehavior === undefined &&
            row.expectedFallbackBehavior !== "none"),
      ).length,
      statefulOnly: corpus.filter((row) => row.expectedDeterministicBehavior === "stateful_only").length,
    },
  };
}

function formatRate(passed: number, total: number): string {
  if (total === 0) {
    return "0/0 (0%)";
  }

  return `${passed}/${total} (${Math.round((passed / total) * 100)}%)`;
}

function normalizeText(value: string): string {
  return value.toLowerCase();
}
