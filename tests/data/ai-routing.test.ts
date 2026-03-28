import { readFileSync } from "node:fs";
import { join } from "node:path";

import { continueDemoConversation } from "@/lib/domain/demo-contracts";
import {
  createInitialDemoState,
  submitMaterialDraft,
  type MaterialDraft,
} from "@/lib/domain/demo-state";
import {
  buildDeterministicConversationClassification,
  buildDeterministicMaterialClassification,
  routeConversationInput,
  routeMaterialInput,
} from "@/lib/server/ai-routing";

describe("ai routing", () => {
  const originalEnv = {
    OPENAI_ROUTING_ENABLED: process.env.OPENAI_ROUTING_ENABLED,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_CLASSIFIER_MODEL: process.env.OPENAI_CLASSIFIER_MODEL,
    OPENAI_RESPONSE_MODEL: process.env.OPENAI_RESPONSE_MODEL,
  };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.OPENAI_ROUTING_ENABLED = "true";
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_CLASSIFIER_MODEL = "gpt-4o-mini";
    process.env.OPENAI_RESPONSE_MODEL = "gpt-4o";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.OPENAI_ROUTING_ENABLED = originalEnv.OPENAI_ROUTING_ENABLED;
    process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
    process.env.OPENAI_CLASSIFIER_MODEL = originalEnv.OPENAI_CLASSIFIER_MODEL;
    process.env.OPENAI_RESPONSE_MODEL = originalEnv.OPENAI_RESPONSE_MODEL;
  });

  it("forces summarize_no_write when classifier returns unknown", async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            inputKind: "unknown",
            journeyStage: "unknown",
            responseMode: "chat_only",
            writePermission: "proposal_allowed",
            candidateCardType: "none",
            candidateAction: "apply_initial_guidance_checkpoint",
            confidence: 0.32,
            reasonShort: "Ambiguous customer message.",
          }),
        }),
      ),
    ) as typeof fetch;

    const state = createInitialDemoState();
    const result = await routeConversationInput({
      state,
      message: "We are all over the place and honestly not even sure what question to ask first.",
      personaSlug: "strategic-stem-striver",
    });

    expect(result.routing.classification.inputKind).toBe("unknown");
    expect(result.routing.responseMode).toBe("summarize_no_write");
    expect(result.routing.writeExecuted).toBe(false);
    expect(result.state.profileFields.schoolList.status).toBe(state.profileFields.schoolList.status);
    expect(result.reply.content).toMatch(/help|unclear|start|first/i);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to deterministic conversation routing when classifier output is malformed", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: "{not-json" })) as Response,
    ) as typeof fetch;

    const result = await routeConversationInput({
      state: createInitialDemoState(),
      message: "I am in 11th grade, aiming for engineering, and we do not have a school list yet.",
      personaSlug: "strategic-stem-striver",
    });

    expect(result.routing.fallbackReason).toBe("classifier_invalid");
    expect(result.routing.writeExecuted).toBe(true);
    expect(result.reply.goal).toBe("deliver_brief");
    expect(result.reply.nextPromptType).toBe("deliver_initial_guidance");
  });

  it("rejects invalid responder action proposals that do not match pending shortlist confirmation", async () => {
    const pendingState = submitMaterialDraft(createInitialDemoState(), {
      type: "school_list",
      title: "Maybe schools",
      content: "Maybe some options are Purdue, Georgia Tech, and UT Austin.",
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              inputKind: "timing_strategy_input",
              journeyStage: "timing_strategy",
              responseMode: "single_select",
              writePermission: "proposal_allowed",
              candidateCardType: "single_select",
              candidateAction: "apply_application_timing_strategy",
              confidence: 0.84,
              reasonShort: "The message mentions early action choices.",
            }),
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              coachMessage:
                "I hear an early-action preference, but I should not finalize timing until the shortlist itself is confirmed.",
              actionProposal: {
                action: "apply_application_timing_strategy",
                payload: {
                  timingSummary: "Early: Purdue | Regular: Georgia Tech",
                },
              },
              shouldWriteState: true,
              fallbackUsed: false,
            }),
          }),
        ),
      ) as typeof fetch;

    const result = await routeConversationInput({
      state: pendingState,
      message: "Let's make Purdue early action and Georgia Tech regular.",
      personaSlug: "strategic-stem-striver",
    });

    expect(result.routing.writeExecuted).toBe(false);
    expect(result.routing.fallbackReason).toBe("proposal_rejected");
    expect(result.routing.responseMode).toBe("summarize_no_write");
    expect(result.state.pendingPatch?.status).toBe("needs_confirmation");
    expect(result.reply.content).toMatch(/confirm|shortlist/i);
  });

  it("allows material submissions to stay visible without writing profile state when the router downgrades to summarize_no_write", async () => {
    const draft: MaterialDraft = {
      type: "freeform_note",
      title: "Messy update",
      content:
        "We are still figuring things out. Maybe there is a school list in here somewhere, but nothing is final and I mostly wanted to vent.",
    };

    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            inputKind: "unknown",
            journeyStage: "unknown",
            responseMode: "summarize_no_write",
            writePermission: "none",
            candidateCardType: "none",
            candidateAction: "none",
            confidence: 0.41,
            reasonShort: "Low-confidence mixed note.",
          }),
        }),
      ),
    ) as typeof fetch;

    const result = await routeMaterialInput({
      state: createInitialDemoState(),
      draft,
      personaSlug: "strategic-stem-striver",
    });

    expect(result.routing.responseMode).toBe("summarize_no_write");
    expect(result.routing.writeExecuted).toBe(false);
    expect(result.state.materials[0]?.title).toBe("Messy update");
    expect(result.state.profileFields.schoolList.status).toBe("unconfirmed");
    expect(result.materialAnalysis?.profileImpact).toMatch(/no profile fields|not update/i);
  });

  it("rejects a timing proposal when the responder payload is missing the required timingSummary", async () => {
    const state = continueDemoConversation({
      state: continueDemoConversation({
        state: submitMaterialDraft(createInitialDemoState(), {
          type: "school_list",
          title: "Confirmed list",
          content: "Purdue, Georgia Tech, UT Austin",
        }),
        message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
      }).state,
      message: "Purdue and Georgia Tech are reach, and UT Austin is target.",
    }).state;

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              inputKind: "timing_strategy_input",
              journeyStage: "timing_strategy",
              responseMode: "chat_only",
              writePermission: "proposal_allowed",
              candidateCardType: "none",
              candidateAction: "apply_application_timing_strategy",
              confidence: 0.91,
              reasonShort: "The customer is clarifying deadlines.",
            }),
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              coachMessage:
                "I can see you are moving into deadline strategy, but I am not going to write timing until I have the exact early-versus-regular mapping.",
              actionProposal: {
                action: "apply_application_timing_strategy",
                payload: {},
              },
              shouldWriteState: true,
              fallbackUsed: false,
            }),
          }),
        ),
      ) as typeof fetch;

    const result = await routeConversationInput({
      state,
      message: "Let's make Purdue early action and keep Georgia Tech regular.",
      personaSlug: "strategic-stem-striver",
    });

    expect(result.routing.writeExecuted).toBe(false);
    expect(result.routing.fallbackReason).toBe("proposal_rejected");
    expect(result.state.profileFields.applicationTiming.status).toBe("unconfirmed");
  });

  it("applies timing strategy from a valid responder payload even when the raw message is less structured than the old regex path", async () => {
    const state = continueDemoConversation({
      state: continueDemoConversation({
        state: submitMaterialDraft(createInitialDemoState(), {
          type: "school_list",
          title: "Confirmed list",
          content: "Purdue, Georgia Tech, UT Austin",
        }),
        message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
      }).state,
      message: "Purdue and Georgia Tech are reach, and UT Austin is target.",
    }).state;

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              inputKind: "timing_strategy_input",
              journeyStage: "timing_strategy",
              responseMode: "chat_only",
              writePermission: "proposal_allowed",
              candidateCardType: "none",
              candidateAction: "apply_application_timing_strategy",
              confidence: 0.92,
              reasonShort: "The user is locking application timing.",
            }),
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              coachMessage:
                "Good. I captured the timing strategy and tightened the plan around early versus regular pacing.",
              actionProposal: {
                action: "apply_application_timing_strategy",
                payload: {
                  timingSummary:
                    "Early: Purdue, Georgia Tech | Regular: UT Austin | Constraint: no binding early decision",
                },
              },
              shouldWriteState: true,
              fallbackUsed: false,
            }),
          }),
        ),
      ) as typeof fetch;

    const result = await routeConversationInput({
      state,
      message: "Let's lock Purdue early and keep UT Austin regular.",
      personaSlug: "strategic-stem-striver",
    });

    expect(result.routing.writeExecuted).toBe(true);
    expect(result.routing.fallbackReason).toBeNull();
    expect(result.state.profileFields.applicationTiming.status).toBe("known");
    expect(result.state.profileFields.applicationTiming.value).toContain("Early:");
    expect(result.state.profileFields.applicationTiming.value).toContain("Regular:");
    expect(result.reply.content).toMatch(/timing strategy|early|regular/i);
  });

  it("keeps deterministic fallback classification aligned with the corpus for direct rule-covered examples", () => {
    const rows = loadRoutingCorpus().filter(
      (row) =>
        row.expectedFallbackBehavior === "none" &&
        row.expectedDeterministicBehavior !== "fallback_unknown" &&
        row.expectedDeterministicBehavior !== "stateful_only",
    );

    for (const row of rows) {
      if (row.channel === "chat") {
        const classification = buildDeterministicConversationClassification(
          createInitialDemoState(),
          row.userInput,
        );

        if (
          row.expectedInputKind === "ask_next_step" ||
          row.expectedInputKind === "emotional_uncertainty"
        ) {
          expect(classification.inputKind).toBe(row.expectedInputKind);
          expect(classification.responseMode).toBe(row.expectedResponseMode);
        }
      }

      if (row.channel === "material") {
        if (
          row.expectedInputKind !== "testing_update_signal" &&
          row.expectedInputKind !== "school_list_candidate" &&
          row.expectedInputKind !== "material_update_signal"
        ) {
          continue;
        }

        const classification = buildDeterministicMaterialClassification({
          type: inferMaterialTypeFromCorpusRow(row.userInput),
          title: "Fixture draft",
          content: row.userInput,
        });

        expect(classification.inputKind).toBe(row.expectedInputKind);
        expect(classification.responseMode).toBe(row.expectedResponseMode);
      }
    }
  });
});

type RoutingCorpusRow = {
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

function loadRoutingCorpus(): RoutingCorpusRow[] {
  const raw = readFileSync(
    join(process.cwd(), "tests/fixtures/ai-routing-corpus.jsonl"),
    "utf8",
  );

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as RoutingCorpusRow);
}

function inferMaterialTypeFromCorpusRow(input: string): MaterialDraft["type"] {
  if (/essay note|main essay|essay/i.test(input)) {
    return "essay_note";
  }

  if (
    /activities note|activity|transcript|dual-enrollment|newspaper|theater|workshop|volunteering/i.test(
      input,
    )
  ) {
    return "freeform_note";
  }

  if (
    /school|schools|list|purdue|georgia tech|ut austin|uc|rutgers|umass|bu|northeastern|nyu|emerson|usc|pitt|case western|rochester/i.test(
      input,
    )
  ) {
    return "school_list";
  }

  if (/sat|act|score/i.test(input)) {
    return "test_score";
  }

  return "freeform_note";
}
