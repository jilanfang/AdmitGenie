import {
  createInitialDemoState,
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
    weeklyBrief: nextState.weeklyBrief,
  };
}

export function continueDemoConversation(
  submission: DemoConversationSubmission,
): DemoConversationResult {
  const state = submission.state ?? createInitialDemoState();
  const message = submission.message.trim();
  const missingProfileFields = getMissingProfileFields(state);
  const replyContent = buildCoachReply(message, missingProfileFields);

  return {
    state: {
      ...state,
      conversation: [
        `Coach: ${replyContent}`,
        `Family: ${message}`,
        ...state.conversation,
      ],
    },
    reply: {
      goal: "clarify_profile",
      content: replyContent,
      missingProfileFields,
    },
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
  message: string,
  missingProfileFields: Array<keyof DemoState["profileFields"]>,
): string {
  const mentionsSchoolList = /school list|college list|target schools?/i.test(message);
  const mentionsTesting = /sat|act|test/i.test(message);

  if (mentionsSchoolList && !mentionsTesting) {
    return "I heard that you do not have a school list yet. The next highest-value detail is your testing status, because that changes how I frame selective targets, timing, and what belongs in reach versus target buckets.";
  }

  if (mentionsTesting) {
    return "That gives me more context on testing. I still want to pin down the school list and target range so the coach can turn your current profile into sharper admissions priorities.";
  }

  if (missingProfileFields.includes("schoolList")) {
    return "I can work with that starting point. The next two gaps are your school list and testing status, because those two fields most directly change the first useful brief and the coach's reach-versus-fit guidance.";
  }

  return "I have enough to keep going, but I still need one sharper profile signal before the advice gets specific. Tell me your current testing status or share the first draft of your school list so I can tighten the next brief.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
