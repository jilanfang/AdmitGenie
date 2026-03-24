import {
  applyApplicationTimingStrategy,
  applyInitialGuidanceCheckpoint,
  applyExecutionBlocker,
  applyExecutionProgress,
  applyReadyToShipActions,
  applySchoolListBuckets,
  applyStoryMaterialPriority,
  confirmPendingSchoolList,
  createInitialDemoState,
  resolvePendingTestingConflict,
  submitMaterialDraft,
  type DemoState,
  type MaterialDraft,
  type MaterialType,
} from "@/lib/domain/demo-state";

export const DEMO_MATERIAL_TYPES: MaterialType[] = [
  "transcript",
  "test_score",
  "activity_update",
  "award",
  "school_list",
  "essay_note",
  "freeform_note",
];

export const DEMO_CONVERSATION_GOALS = [
  "collect_context",
  "clarify_profile",
  "confirm_patch",
  "deliver_brief",
  "follow_up_action",
  "resolve_conflict",
] as const;

export type ConversationGoal = (typeof DEMO_CONVERSATION_GOALS)[number];

export type DemoCapabilities = {
  materialTypes: MaterialType[];
  conversationGoals: ConversationGoal[];
};

export type DemoCoachReply = {
  goal: ConversationGoal;
  content: string;
  missingProfileFields: Array<keyof DemoState["profileFields"]>;
  nextPromptType: string;
};

export type DemoStateResponse = {
  state: DemoState;
  capabilities: DemoCapabilities;
};

export type DemoMaterialSubmission = {
  state?: DemoState;
  draft: MaterialDraft;
};

export type DemoMaterialResult = {
  state: DemoState;
  latestPatch: DemoState["patches"][number] | null;
  materialAnalysis: DemoState["materialAnalysis"][number] | null;
  weeklyBrief: DemoState["weeklyBrief"];
};

export type DemoConversationSubmission = {
  state?: DemoState;
  message: string;
};

export type DemoConversationResult = {
  state: DemoState;
  reply: DemoCoachReply;
};

export function getDemoCapabilities(): DemoCapabilities {
  return {
    materialTypes: [...DEMO_MATERIAL_TYPES],
    conversationGoals: [...DEMO_CONVERSATION_GOALS],
  };
}

export function getInitialDemoStateResponse(): DemoStateResponse {
  return {
    state: createInitialDemoState(),
    capabilities: getDemoCapabilities(),
  };
}

export function isMaterialDraft(value: unknown): value is MaterialDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.content === "string" &&
    value.content.trim().length > 0 &&
    typeof value.type === "string" &&
    DEMO_MATERIAL_TYPES.includes(value.type as MaterialType)
  );
}

export function applyDemoMaterial(
  submission: DemoMaterialSubmission,
): DemoMaterialResult {
  const state = submission.state ?? createInitialDemoState();
  const nextState = submitMaterialDraft(state, submission.draft);

  return {
    state: nextState,
    latestPatch: nextState.patches[0] ?? null,
    materialAnalysis: nextState.materialAnalysis[0] ?? null,
    weeklyBrief: nextState.weeklyBrief,
  };
}

export function continueDemoConversation(
  submission: DemoConversationSubmission,
): DemoConversationResult {
  const state = submission.state ?? createInitialDemoState();
  const message = submission.message.trim();
  const transition = advanceConversationState(state, message);
  const replyState = transition?.state ?? state;
  const missingProfileFields = getMissingProfileFields(replyState);
  const reply = transition?.reply ?? buildCoachReply(replyState, message, missingProfileFields);

  return {
    state: {
      ...replyState,
      conversation: [...replyState.conversation, `Family: ${message}`, `Coach: ${reply.content}`],
    },
    reply,
  };
}

function getMissingProfileFields(
  state: DemoState,
): Array<keyof DemoState["profileFields"]> {
  return (Object.entries(state.profileFields) as Array<
    [keyof DemoState["profileFields"], DemoState["profileFields"][keyof DemoState["profileFields"]]]
  >)
    .filter(([, field]) => field.status !== "known")
    .map(([key]) => key);
}

function buildCoachReply(
  state: DemoState,
  message: string,
  missingProfileFields: Array<keyof DemoState["profileFields"]>,
): DemoCoachReply {
  const mentionsSchoolList = /school list|college list|target schools?/i.test(message);
  const mentionsTesting = /sat|act|test/i.test(message);
  const asksForNextStep = /what now|what next|next step|what should i do next/i.test(message);

  if (state.pendingPatch?.status === "needs_confirmation") {
    return {
      goal: "confirm_patch",
      content:
        "Before I move on, I need to confirm the school list signal I just found. Is that actually your current shortlist, or was it just an early brainstorm?",
      missingProfileFields,
      nextPromptType: "confirm_school_list",
    };
  }

  if (state.pendingPatch?.status === "conflict") {
    return {
      goal: "resolve_conflict",
      content:
        "I still need you to resolve the conflicting testing update before I tighten the advice. Which score should I trust for your current profile?",
      missingProfileFields,
      nextPromptType: "resolve_testing_conflict",
    };
  }

  if (
    asksForNextStep &&
    state.materialAnalysis[0]?.patchStatus === "applied" &&
    state.profileFields.testingStatus.status === "known"
  ) {
    return {
      goal: "follow_up_action",
      content:
        "Now that testing is stronger, the next execution step is your school list. Start by sorting schools into reach, target, and safer-fit buckets so I can turn this into sharper next-step guidance.",
      missingProfileFields,
      nextPromptType: "advance_school_list",
    };
  }

  if (mentionsSchoolList && !mentionsTesting) {
    return {
      goal: "clarify_profile",
      content:
        "I heard that you do not have a school list yet. The next highest-value detail is your testing status, because that changes how I frame selective targets, timing, and what belongs in reach versus target buckets.",
      missingProfileFields,
      nextPromptType: "ask_testing_status",
    };
  }

  if (mentionsTesting) {
    return {
      goal: "clarify_profile",
      content:
        "That gives me more context on testing. I still want to pin down the school list and target range so the coach can turn your current profile into sharper admissions priorities.",
      missingProfileFields,
      nextPromptType: "ask_school_list",
    };
  }

  if (missingProfileFields.includes("schoolList")) {
    return {
      goal: "clarify_profile",
      content:
        "I can work with that starting point. The next two gaps are your school list and testing status, because those two fields most directly change the first useful brief and the coach's reach-versus-fit guidance.",
      missingProfileFields,
      nextPromptType: "ask_testing_status",
    };
  }

  if (
    state.profileFields.schoolList.status === "known" &&
    /\bReach:/i.test(state.profileFields.schoolList.value) &&
    state.profileFields.applicationTiming.status !== "known"
  ) {
    return {
      goal: "follow_up_action",
      content:
        "Now that the list is bucketed, the next move is timing. Tell me which schools are early action, early decision, or regular decision so I can turn the plan into deadline-aware priorities.",
      missingProfileFields,
      nextPromptType: "clarify_deadline_strategy",
    };
  }

  return {
    goal: "clarify_profile",
    content:
      "I have enough to keep going, but I still need one sharper profile signal before the advice gets specific. Tell me your current testing status or share the first draft of your school list so I can tighten the next brief.",
    missingProfileFields,
    nextPromptType: "ask_profile_signal",
  };
}

function advanceConversationState(
  state: DemoState,
  message: string,
): { state: DemoState; reply: DemoCoachReply } | null {
  if (state.pendingPatch?.status === "needs_confirmation" && isAffirmativeSchoolListConfirmation(message)) {
    const nextState = confirmPendingSchoolList(state);

    return {
      state: nextState,
      reply: {
        goal: "confirm_patch",
        content:
          "Confirmed. I updated your school list and will use it as the working shortlist. The next move is to sort it into reach, target, and safer-fit buckets so the guidance gets more concrete.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "advance_school_list",
      },
    };
  }

  if (state.pendingPatch?.status === "conflict") {
    const selection = readTestingConflictResolution(message);

    if (selection) {
      const nextState = resolvePendingTestingConflict(state, selection);

      return {
        state: nextState,
        reply: {
          goal: "resolve_conflict",
          content:
            selection === "latest"
              ? "Resolved. I updated the testing profile to the newer score, so we can move forward with that baseline. The next bottleneck is sharpening your school list."
              : "Resolved. I kept the current testing profile as the trusted baseline. The next bottleneck is sharpening your school list so the guidance becomes more actionable.",
          missingProfileFields: getMissingProfileFields(nextState),
          nextPromptType: "advance_school_list",
        },
      };
    }
  }

  const starterSignals = parseStarterSignals(message);

  if (shouldDeliverInitialGuidance(state, starterSignals)) {
    const nextPromptType =
      state.profileFields.testingStatus.status !== "known"
        ? "ask_testing_status"
        : state.profileFields.schoolList.status !== "known"
          ? "ask_school_list"
          : "ask_profile_signal";
    const concernSummary = starterSignals.concernSummary
      ? ` The main concern right now is ${starterSignals.concernSummary}.`
      : "";
    const nextState = applyInitialGuidanceCheckpoint(state, {
      currentFocus:
        "Top priority: lock testing context and build the first realistic school list so the coach can move into concrete planning",
      weeklyBrief: {
        whatChanged:
          "We now have a clearer starter understanding of the profile, even though key planning inputs are still incomplete.",
        whatMatters:
          "The immediate bottleneck is reducing uncertainty around testing and school-list strategy so the advice can move from broad ambition into concrete next steps.",
        topActions: [
          "Tell the coach your current SAT / ACT status or most recent official result.",
          "Share the first 6-10 schools you are seriously considering.",
          "Add one recent activity, project, or academic signal that strengthens the profile beyond baseline academics.",
        ],
        risks: [
          starterSignals.concernSummary
            ? `If ${starterSignals.concernSummary} stays unresolved without a real shortlist, the plan can stay emotionally driven instead of calibrated.`
            : "Without a real shortlist, the plan can stay broad and emotionally driven instead of calibrated.",
          "Without clearer testing context, it is still too early to judge how ambitious the current targets should be.",
        ],
        whyThisAdvice:
          "The coach now has enough starter context to give a useful first priority, but testing and school-list clarity are still the two highest-leverage inputs for sharper admissions guidance.",
      },
    });

    return {
      state: nextState,
      reply: {
        goal: "deliver_brief",
        content: [
          "Current understanding: you are working from an ambitious early profile, but your testing baseline and school list are still not locked." +
            concernSummary,
          "Top priority this month: reduce uncertainty in testing and school-list strategy so the coach can turn broad ambition into a real admissions plan.",
          "What would sharpen the advice next: your latest SAT / ACT status and the first 6-10 schools you are seriously considering.",
          nextPromptType === "ask_testing_status"
            ? "Start with your current SAT / ACT status so I can tighten the first recommendation."
            : nextPromptType === "ask_school_list"
              ? "Start with the first 6-10 schools on your radar so I can tighten the first recommendation."
              : "Give me one stronger profile signal next so I can tighten the first recommendation.",
        ].join(" "),
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "deliver_initial_guidance",
      },
    };
  }

  const schoolListBuckets = parseSchoolListBuckets(message);

  if (schoolListBuckets && state.profileFields.schoolList.status === "known") {
    const nextState = applySchoolListBuckets(state, schoolListBuckets);

    return {
      state: nextState,
      reply: {
        goal: "follow_up_action",
        content:
          "Good. I turned that into a working bucketed school-list strategy with reach and target groups. Now we can compare deadlines, testing expectations, and where you still need stronger profile evidence.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "clarify_deadline_strategy",
      },
    };
  }

  const applicationTiming = parseApplicationTiming(message);

  if (
    applicationTiming &&
    state.profileFields.schoolList.status === "known" &&
    /\bReach:/i.test(state.profileFields.schoolList.value)
  ) {
    const nextState = applyApplicationTimingStrategy(state, applicationTiming);

    return {
      state: nextState,
      reply: {
        goal: "follow_up_action",
        content:
          "Good. I captured that timing strategy and tightened the plan around early versus regular application pacing. Next I would prioritize which materials need to be ready first for the early-round schools.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "advance_deadline_strategy",
      },
    };
  }

  const resolvedExecutionBlocker = parseResolvedExecutionBlocker(message);

  if (
    resolvedExecutionBlocker &&
    state.profileFields.applicationTiming.status === "known"
  ) {
    const nextState = applyReadyToShipActions(state, resolvedExecutionBlocker);

    return {
      state: nextState,
      reply: {
        goal: "follow_up_action",
        content:
          "Good. The early-round package is now close enough to move into final polishing and review. I would focus on final polish, evidence placement, and making the strongest applications submission-ready.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "ship_ready_actions",
      },
    };
  }

  const executionBlocker = parseExecutionBlocker(message);

  if (
    executionBlocker &&
    state.profileFields.applicationTiming.status === "known"
  ) {
    const nextState = applyExecutionBlocker(state, executionBlocker);

    return {
      state: nextState,
      reply: {
        goal: "follow_up_action",
        content:
          "Understood. Execution is blocked on a few specific proof gaps. I would now tighten the work around the stronger leadership example for Purdue and the clearer robotics proof for Georgia Tech before adding more lower-priority tasks.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "resolve_execution_blocker",
      },
    };
  }

  const executionProgress = parseExecutionProgress(message);

  if (
    executionProgress &&
    state.profileFields.applicationTiming.status === "known"
  ) {
    const nextState = applyExecutionProgress(state, executionProgress);

    return {
      state: nextState,
      reply: {
        goal: "follow_up_action",
        content:
          "Good. The execution progress for the early-round materials is now real. I can see draft work and supporting evidence moving, so the next step is finishing those strongest stories before lower-priority applications expand.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "track_execution_progress",
      },
    };
  }

  const storyPriority = parseStoryMaterialPriority(message);

  if (
    storyPriority &&
    state.profileFields.applicationTiming.status === "known"
  ) {
    const nextState = applyStoryMaterialPriority(state, storyPriority);

    return {
      state: nextState,
      reply: {
        goal: "follow_up_action",
        content:
          "Good. I now have a clearer story and material priority for the early-round schools. The next move is making sure those strongest stories get drafted and supported before lower-priority work expands.",
        missingProfileFields: getMissingProfileFields(nextState),
        nextPromptType: "advance_story_priority",
      },
    };
  }

  return null;
}

function isAffirmativeSchoolListConfirmation(message: string): boolean {
  return /(^|\b)(yes|correct|confirmed|that is right|that's right|please use|use this|current shortlist|real shortlist)/i.test(
    message,
  );
}

function readTestingConflictResolution(
  message: string,
): "latest" | "current" | null {
  if (/\b(newer|latest|use the new|use the newer|700|680)\b/i.test(message)) {
    return "latest";
  }

  if (/\b(current|existing|keep the current|keep the existing|760|730)\b/i.test(message)) {
    return "current";
  }

  return null;
}

function parseSchoolListBuckets(
  message: string,
): { reach: string[]; target: string[]; saferFit: string[] } | null {
  const segments = message
    .split(/[.!?]\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  const reach = segments.flatMap((segment) =>
    extractBucketSchoolsFromSegment(segment, /\b(?:is|are)\s+reach\b/i),
  );
  const target = segments.flatMap((segment) =>
    extractBucketSchoolsFromSegment(segment, /\b(?:is|are)\s+target\b/i),
  );
  const saferFit = segments.flatMap((segment) =>
    extractBucketSchoolsFromSegment(
      segment,
      /\b(?:is|are)\s+(?:safer-fit|safer fit|safety|safe)\b/i,
    ),
  );

  if (reach.length === 0 && target.length === 0 && saferFit.length === 0) {
    return null;
  }

  return { reach, target, saferFit };
}

function extractBucketSchoolsFromSegment(
  segment: string,
  bucketPattern: RegExp,
): string[] {
  const matchIndex = segment.search(bucketPattern);

  if (matchIndex === -1) {
    return [];
  }

  return segment
    .slice(0, matchIndex)
    .split(/,| and /i)
    .map((item) =>
      item
        .trim()
        .replace(/\b(schools?|options?)\b/gi, "")
        .replace(/\bfor us\b/gi, "")
        .trim(),
    )
    .filter((item) => item.length > 0);
}

function parseApplicationTiming(message: string): string | null {
  const segments = message
    .split(/[.!?]\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  const early = segments.flatMap((segment) =>
    extractBucketSchoolsFromSegment(
      segment,
      /\b(?:is|are)\s+(?:early action|ea|early decision|ed|rea|early)\b/i,
    ),
  );
  const regular = segments.flatMap((segment) =>
    extractBucketSchoolsFromSegment(
      segment,
      /\b(?:is|are)\s+(?:regular decision|rd|regular)\b/i,
    ),
  );
  const constraints: string[] = [];

  if (/\b(?:no|not|do not want)\s+binding early decision\b/i.test(message)) {
    constraints.push("Constraint: no binding early decision");
  } else if (/\bnon-binding early\b/i.test(message)) {
    constraints.push("Constraint: early applications should stay non-binding");
  }

  const summary = [
    early.length > 0 ? `Early: ${early.join(", ")}` : null,
    regular.length > 0 ? `Regular: ${regular.join(", ")}` : null,
    ...constraints,
  ]
    .filter((section): section is string => section !== null)
    .join(" | ");

  return summary.length > 0 ? summary : null;
}

function parseStoryMaterialPriority(message: string): string | null {
  if (!/\b(story|stories|material|materials|essay|essays|priority)\b/i.test(message)) {
    return null;
  }

  const normalized = message.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : null;
}

function parseExecutionProgress(message: string): string | null {
  if (
    !/\b(drafted|draft|finished|completed|collected|gathered|evidence|proof|outlined)\b/i.test(
      message,
    )
  ) {
    return null;
  }

  const normalized = message.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : null;
}

function parseExecutionBlocker(message: string): string | null {
  if (
    !/\b(blocked|stuck|missing|need[s]? a stronger|need[s]? clearer|proof gap|not enough)\b/i.test(
      message,
    )
  ) {
    return null;
  }

  const normalized = message.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : null;
}

function parseResolvedExecutionBlocker(message: string): string | null {
  if (
    !/\b(now have|blockers are resolved|resolved|fixed|unblocked|we now have)\b/i.test(
      message,
    )
  ) {
    return null;
  }

  const normalized = message.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : null;
}

function shouldDeliverInitialGuidance(
  state: DemoState,
  starterSignals: ReturnType<typeof parseStarterSignals>,
): boolean {
  if (state.pendingPatch || state.materials.length > 0) {
    return false;
  }

  if (state.conversation.some((entry) => /Current understanding:/i.test(entry))) {
    return false;
  }

  if (state.conversation.length > 6) {
    return false;
  }

  return starterSignals.signalCount >= 2;
}

function parseStarterSignals(message: string): {
  signalCount: number;
  concernSummary: string | null;
} {
  const hasDirection = /\b(engineering|stem|computer science|cs|selective)\b/i.test(message);
  const hasSchoolListGap =
    /\b(no school list|do not have a school list|don't have a school list|no shortlist|school list yet)\b/i.test(
      message,
    );
  const hasTestingGap =
    /\b(testing is still unclear|testing is unclear|testing is still unconfirmed|testing is unconfirmed|no sat|no act|haven't taken|have not taken|test plan is unclear|sat.*unclear|act.*unclear)\b/i.test(
      message,
    );
  const hasConcern =
    /\b(worried|unclear|uncertain|confused|stress|stressed|concerned|too high|too ambitious)\b/i.test(
      message,
    );

  const concernSummary =
    /\btoo high|too ambitious\b/i.test(message)
      ? "whether the current target level is too ambitious"
      : /\bconfused|unclear|uncertain\b/i.test(message)
        ? "how to turn partial information into a realistic first plan"
        : /\bstress|stressed|worried|concerned\b/i.test(message)
          ? "the family feeling behind or uncertain about the next move"
          : null;

  return {
    signalCount: [hasDirection, hasSchoolListGap, hasTestingGap, hasConcern].filter(Boolean)
      .length,
    concernSummary,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
