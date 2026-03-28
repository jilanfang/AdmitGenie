import {
  applyDemoMaterial,
  continueDemoConversation,
  type DemoCoachReply,
  type DemoConversationResult,
  type DemoMaterialResult,
} from "@/lib/domain/demo-contracts";
import {
  deriveDecisionCard,
  applyApplicationTimingStrategy,
  applyExecutionBlocker,
  applyExecutionProgress,
  applyInitialGuidanceCheckpoint,
  applyReadyToShipActions,
  applySchoolListBuckets,
  applyStoryMaterialPriority,
  confirmPendingSchoolList,
  resolvePendingTestingConflict,
  type DecisionCardType,
  type DemoState,
  type MaterialAnalysis,
  type MaterialDraft,
  type MaterialItem,
  type ProfilePatch,
} from "@/lib/domain/demo-state";
import {
  classifyInput as classifyWithOpenAI,
  generateCoachResponse as generateWithOpenAI,
} from "@/lib/server/openai-routing-adapter";

export type RoutingInputKind =
  | "starter_context"
  | "starter_uncertainty"
  | "ask_next_step"
  | "material_update_signal"
  | "school_list_candidate"
  | "school_list_confirmation"
  | "testing_update_signal"
  | "testing_conflict_resolution"
  | "school_bucket_input"
  | "timing_strategy_input"
  | "material_priority_input"
  | "execution_progress_input"
  | "execution_blocker_input"
  | "blocker_resolved_input"
  | "emotional_uncertainty"
  | "off_topic"
  | "unknown";

export type RoutingJourneyStage =
  | "starter_clarity"
  | "shortlist_confirmation"
  | "school_bucketing"
  | "timing_strategy"
  | "proof_gap_closure"
  | "material_priority"
  | "monthly_execution"
  | "unknown";

export type RoutingResponseMode =
  | "chat_only"
  | "yes_no"
  | "single_select"
  | "multi_select"
  | "summarize_no_write";

export type RoutingWritePermission = "none" | "proposal_allowed";
export type RoutingCardType = DecisionCardType | "none";

export type RoutingAction =
  | "none"
  | "apply_initial_guidance_checkpoint"
  | "submit_material_draft"
  | "confirm_pending_school_list"
  | "resolve_pending_testing_conflict"
  | "apply_school_list_buckets"
  | "apply_application_timing_strategy"
  | "apply_story_material_priority"
  | "apply_execution_progress"
  | "apply_execution_blocker"
  | "apply_ready_to_ship_actions";

export type ClassificationResult = {
  inputKind: RoutingInputKind;
  journeyStage: RoutingJourneyStage;
  responseMode: RoutingResponseMode;
  writePermission: RoutingWritePermission;
  candidateCardType: RoutingCardType;
  candidateAction: RoutingAction;
  confidence: number;
  reasonShort: string;
};

export type RoutingMetadata = {
  classification: ClassificationResult;
  responseMode: RoutingResponseMode;
  writeExecuted: boolean;
  fallbackReason: string | null;
};

type ResponsePolicy = {
  responseMode: RoutingResponseMode;
  cardAllowed: RoutingCardType;
  writeAllowed: boolean;
  allowedActions: RoutingAction[];
};

type ActionProposal = {
  action: RoutingAction;
  payload?: Record<string, unknown>;
};

type ResponseModelOutput = {
  coachMessage: string;
  actionProposal?: ActionProposal | null;
  shouldWriteState: boolean;
  fallbackUsed: boolean;
};

export type RouteConversationInputArgs = {
  state: DemoState;
  message: string;
  personaSlug: string;
  workspace?: string;
};

export type RouteConversationInputResult = DemoConversationResult & {
  routing: RoutingMetadata;
};

export type RouteMaterialInputArgs = {
  state: DemoState;
  draft: MaterialDraft;
  personaSlug: string;
  workspace?: string;
};

export type RouteMaterialInputResult = DemoMaterialResult & {
  routing: RoutingMetadata;
};

const DEFAULT_CLASSIFIER_MODEL = "gpt-4o-mini";
const DEFAULT_RESPONSE_MODEL = "gpt-4o";

export async function routeConversationInput(
  args: RouteConversationInputArgs,
): Promise<RouteConversationInputResult> {
  const classification = await classifyEnvelope({
    channel: "chat",
    state: args.state,
    personaSlug: args.personaSlug,
    workspace: args.workspace,
    messageText: args.message,
  });

  if (!isOpenAIRoutingEnabled()) {
    return runDeterministicConversation(args.state, args.message, null);
  }

  if (!classification.ok) {
    return runDeterministicConversation(args.state, args.message, classification.reason);
  }

  if (classification.value.inputKind === "unknown") {
    return summarizeConversationWithoutWrite(args.state, args.message, classification.value, null);
  }

  const policy = buildResponsePolicy(args.state, classification.value);
  const response = await generateResponse({
    state: args.state,
    personaSlug: args.personaSlug,
    messageText: args.message,
    policy,
    classification: classification.value,
  });

  if (!response.ok) {
    return runDeterministicConversation(
      args.state,
      args.message,
      response.reason,
      classification.value,
    );
  }

  const proposedAction = normalizeActionProposal(response.value.actionProposal);

  if (
    response.value.shouldWriteState &&
    proposedAction &&
    !canExecuteAction(args.state, policy, proposedAction)
  ) {
    return summarizeConversationWithoutWrite(
      args.state,
      args.message,
      classification.value,
      "proposal_rejected",
      buildPendingStateSummary(args.state, response.value.coachMessage),
    );
  }

  if (response.value.shouldWriteState && proposedAction && canExecuteAction(args.state, policy, proposedAction)) {
    const deterministic = executeConversationProposal(
      args.state,
      args.message,
      proposedAction,
      response.value.coachMessage,
    );

    return {
      state: deterministic.state,
      reply: {
        ...deterministic.reply,
        content: response.value.coachMessage,
      },
      routing: {
        classification: classification.value,
        responseMode: policy.responseMode,
        writeExecuted: true,
        fallbackReason: null,
      },
    };
  }

  return summarizeConversationWithoutWrite(
    args.state,
    args.message,
    classification.value,
    response.value.fallbackUsed ? "response_model_fallback" : null,
    response.value.coachMessage,
  );
}

export async function routeMaterialInput(
  args: RouteMaterialInputArgs,
): Promise<RouteMaterialInputResult> {
  const classification = await classifyEnvelope({
    channel: "material",
    state: args.state,
    personaSlug: args.personaSlug,
    workspace: args.workspace,
    messageText: args.draft.content,
    materialDraft: args.draft,
  });

  if (!isOpenAIRoutingEnabled()) {
    return runDeterministicMaterial(args.state, args.draft, null);
  }

  if (!classification.ok) {
    return runDeterministicMaterial(args.state, args.draft, classification.reason);
  }

  if (classification.value.inputKind === "unknown" || classification.value.responseMode === "summarize_no_write") {
    return storeMaterialWithoutProfileWrite(args.state, args.draft, classification.value);
  }

  const deterministic = applyDemoMaterial({
    state: args.state,
    draft: args.draft,
  });

  return {
    ...deterministic,
    routing: {
      classification: classification.value,
      responseMode: classification.value.responseMode,
      writeExecuted: true,
      fallbackReason: null,
    },
  };
}

function executeConversationProposal(
  state: DemoState,
  message: string,
  proposal: ActionProposal,
  coachMessage: string,
): DemoConversationResult {
  const nextState = applyProposalToState(state, proposal);

  if (!nextState) {
    return continueDemoConversation({
      state,
      message,
    });
  }

  return {
    state: {
      ...nextState,
      conversation: [...nextState.conversation, `Family: ${message}`, `Coach: ${coachMessage}`],
    },
    reply: buildReplyFromProposalState(nextState, coachMessage),
  };
}

type Envelope = {
  channel: "chat" | "material";
  messageText: string;
  materialDraft?: MaterialDraft;
  state: DemoState;
  personaSlug: string;
  workspace?: string;
};

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

async function classifyEnvelope(envelope: Envelope): Promise<Result<ClassificationResult>> {
  if (!isOpenAIRoutingEnabled()) {
    return { ok: false, reason: "routing_disabled" };
  }

  const result = await classifyWithOpenAI({
    model: process.env.OPENAI_CLASSIFIER_MODEL?.trim() || DEFAULT_CLASSIFIER_MODEL,
    input: buildClassifierPrompt(envelope),
  });

  if (!result.ok) {
    return { ok: false, reason: normalizeAdapterReason("classifier", result.reason) };
  }

  if (!isClassificationResult(result.value)) {
    return { ok: false, reason: "classifier_invalid" };
  }

  return { ok: true, value: result.value };
}

async function generateResponse(args: {
  state: DemoState;
  personaSlug: string;
  messageText: string;
  policy: ResponsePolicy;
  classification: ClassificationResult;
}): Promise<Result<ResponseModelOutput>> {
  const result = await generateWithOpenAI({
    model: process.env.OPENAI_RESPONSE_MODEL?.trim() || DEFAULT_RESPONSE_MODEL,
    input: buildResponsePrompt(args),
  });

  if (!result.ok) {
    return { ok: false, reason: normalizeAdapterReason("responder", result.reason) };
  }

  if (!isResponseModelOutput(result.value)) {
    return { ok: false, reason: "responder_invalid" };
  }

  return { ok: true, value: result.value };
}

function normalizeAdapterReason(
  stage: "classifier" | "responder",
  reason: string,
): string {
  if (reason === "adapter_invalid_json") {
    return stage === "classifier" ? "classifier_invalid" : "responder_invalid";
  }

  return reason;
}

function buildClassifierPrompt(envelope: Envelope): string {
  return [
    "Classify this AdmitGenie customer input for a North America admissions coach.",
    "Return JSON only.",
    `Channel: ${envelope.channel}`,
    `Persona: ${envelope.personaSlug}`,
    `Current pending patch: ${envelope.state.pendingPatch?.status ?? "none"}`,
    `Current application timing status: ${envelope.state.profileFields.applicationTiming.status}`,
    `Current school list status: ${envelope.state.profileFields.schoolList.status}`,
    `User input: ${envelope.messageText}`,
    envelope.materialDraft ? `Material draft type: ${envelope.materialDraft.type}` : "Material draft type: none",
  ].join("\n");
}

function buildResponsePrompt(args: {
  state: DemoState;
  personaSlug: string;
  messageText: string;
  policy: ResponsePolicy;
  classification: ClassificationResult;
}): string {
  return [
    "You are AdmitGenie's coach reply model.",
    "Return JSON only.",
    `Persona: ${args.personaSlug}`,
    `Input kind: ${args.classification.inputKind}`,
    `Journey stage: ${args.classification.journeyStage}`,
    `Response mode: ${args.policy.responseMode}`,
    `Card allowed: ${args.policy.cardAllowed}`,
    `Write allowed: ${String(args.policy.writeAllowed)}`,
    `Allowed actions: ${args.policy.allowedActions.join(", ") || "none"}`,
    `Pending patch: ${args.state.pendingPatch?.status ?? "none"}`,
    `Current focus: ${args.state.profileFields.currentFocus.value}`,
    `User input: ${args.messageText}`,
    "Tone: calm, coach-led, family-friendly, North America admissions context.",
  ].join("\n");
}

function buildResponsePolicy(
  state: DemoState,
  classification: ClassificationResult,
): ResponsePolicy {
  if (state.pendingPatch?.status === "needs_confirmation") {
    return {
      responseMode: "multi_select",
      cardAllowed: "multi_select",
      writeAllowed: true,
      allowedActions: ["confirm_pending_school_list"],
    };
  }

  if (state.pendingPatch?.status === "conflict") {
    return {
      responseMode: "single_select",
      cardAllowed: "single_select",
      writeAllowed: true,
      allowedActions: ["resolve_pending_testing_conflict"],
    };
  }

  if (classification.inputKind === "unknown") {
    return {
      responseMode: "summarize_no_write",
      cardAllowed: "none",
      writeAllowed: false,
      allowedActions: [],
    };
  }

  return {
    responseMode: classification.responseMode,
    cardAllowed: classification.candidateCardType,
    writeAllowed: classification.writePermission === "proposal_allowed",
    allowedActions: classification.candidateAction === "none" ? [] : [classification.candidateAction],
  };
}

function canExecuteAction(
  state: DemoState,
  policy: ResponsePolicy,
  proposal: ActionProposal,
): boolean {
  if (!policy.writeAllowed) {
    return false;
  }

  if (!policy.allowedActions.includes(proposal.action)) {
    return false;
  }

  if (state.pendingPatch?.status === "needs_confirmation") {
    return proposal.action === "confirm_pending_school_list";
  }

  if (state.pendingPatch?.status === "conflict") {
    return proposal.action === "resolve_pending_testing_conflict";
  }

  return hasValidProposalPayload(proposal);
}

function normalizeActionProposal(value: unknown): ActionProposal | null {
  if (!isRecord(value) || !isRoutingAction(value.action)) {
    return null;
  }

  return {
    action: value.action,
    payload: isRecord(value.payload) ? value.payload : undefined,
  };
}

function hasValidProposalPayload(proposal: ActionProposal): boolean {
  switch (proposal.action) {
    case "none":
    case "submit_material_draft":
    case "confirm_pending_school_list":
    case "resolve_pending_testing_conflict":
      return true;
    case "apply_initial_guidance_checkpoint":
      return hasStringPayloadField(proposal.payload, "currentFocus");
    case "apply_school_list_buckets":
      return (
        hasStringArrayPayloadField(proposal.payload, "reach") ||
        hasStringArrayPayloadField(proposal.payload, "target") ||
        hasStringArrayPayloadField(proposal.payload, "saferFit")
      );
    case "apply_application_timing_strategy":
      return hasStringPayloadField(proposal.payload, "timingSummary");
    case "apply_story_material_priority":
      return hasStringPayloadField(proposal.payload, "prioritySummary");
    case "apply_execution_progress":
      return hasStringPayloadField(proposal.payload, "progressSummary");
    case "apply_execution_blocker":
      return hasStringPayloadField(proposal.payload, "blockerSummary");
    case "apply_ready_to_ship_actions":
      return hasStringPayloadField(proposal.payload, "resolutionSummary");
    default:
      return false;
  }
}

function applyProposalToState(
  state: DemoState,
  proposal: ActionProposal,
): DemoState | null {
  switch (proposal.action) {
    case "confirm_pending_school_list":
      return confirmPendingSchoolList(state);
    case "resolve_pending_testing_conflict": {
      const selection =
        proposal.payload?.selection === "latest" || proposal.payload?.selection === "current"
          ? (proposal.payload.selection as "latest" | "current")
          : null;
      return selection ? resolvePendingTestingConflict(state, selection) : null;
    }
    case "apply_initial_guidance_checkpoint":
      return hasStringPayloadField(proposal.payload, "currentFocus")
        ? applyInitialGuidanceCheckpoint(state, {
            currentFocus: proposal.payload?.currentFocus as string,
            weeklyBrief: state.weeklyBrief,
          })
        : null;
    case "apply_school_list_buckets":
      return applySchoolListBuckets(state, {
        reach: readStringArrayPayloadField(proposal.payload, "reach"),
        target: readStringArrayPayloadField(proposal.payload, "target"),
        saferFit: readStringArrayPayloadField(proposal.payload, "saferFit"),
      });
    case "apply_application_timing_strategy":
      return hasStringPayloadField(proposal.payload, "timingSummary")
        ? applyApplicationTimingStrategy(state, proposal.payload?.timingSummary as string)
        : null;
    case "apply_story_material_priority":
      return hasStringPayloadField(proposal.payload, "prioritySummary")
        ? applyStoryMaterialPriority(state, proposal.payload?.prioritySummary as string)
        : null;
    case "apply_execution_progress":
      return hasStringPayloadField(proposal.payload, "progressSummary")
        ? applyExecutionProgress(state, proposal.payload?.progressSummary as string)
        : null;
    case "apply_execution_blocker":
      return hasStringPayloadField(proposal.payload, "blockerSummary")
        ? applyExecutionBlocker(state, proposal.payload?.blockerSummary as string)
        : null;
    case "apply_ready_to_ship_actions":
      return hasStringPayloadField(proposal.payload, "resolutionSummary")
        ? applyReadyToShipActions(state, proposal.payload?.resolutionSummary as string)
        : null;
    case "none":
    case "submit_material_draft":
    default:
      return null;
  }
}

function buildReplyFromProposalState(
  state: DemoState,
  content: string,
): DemoCoachReply {
  return {
    goal: state.pendingPatch?.status === "conflict" ? "resolve_conflict" : "follow_up_action",
    content,
    missingProfileFields: getMissingProfileFields(state),
    nextPromptType:
      state.profileFields.applicationTiming.status === "known"
        ? "advance_deadline_strategy"
        : state.profileFields.schoolList.status === "known" &&
            /\bReach:/i.test(state.profileFields.schoolList.value)
          ? "clarify_deadline_strategy"
          : "ask_profile_signal",
  };
}

function summarizeConversationWithoutWrite(
  state: DemoState,
  message: string,
  classification: ClassificationResult,
  fallbackReason: string | null,
  coachMessage?: string,
): RouteConversationInputResult {
  const content = coachMessage ?? buildSafeSummary(state, message);
  const reply = buildNoWriteReply(state, content);
  const nextState = {
    ...state,
    conversation: [...state.conversation, `Family: ${message}`, `Coach: ${content}`],
  };

  return {
    state: nextState,
    reply,
    routing: {
      classification,
      responseMode: "summarize_no_write",
      writeExecuted: false,
      fallbackReason,
    },
  };
}

function runDeterministicConversation(
  state: DemoState,
  message: string,
  fallbackReason: string | null,
  classification: ClassificationResult = buildDeterministicConversationClassification(state, message),
): RouteConversationInputResult {
  const deterministic = continueDemoConversation({ state, message });

  return {
    ...deterministic,
    routing: {
      classification,
      responseMode: deriveResponseModeFromState(deterministic.state),
      writeExecuted: true,
      fallbackReason,
    },
  };
}

function runDeterministicMaterial(
  state: DemoState,
  draft: MaterialDraft,
  fallbackReason: string | null,
): RouteMaterialInputResult {
  const deterministic = applyDemoMaterial({ state, draft });

  return {
    ...deterministic,
    routing: {
      classification: buildDeterministicMaterialClassification(draft),
      responseMode: deriveResponseModeFromState(deterministic.state),
      writeExecuted: true,
      fallbackReason,
    },
  };
}

function storeMaterialWithoutProfileWrite(
  state: DemoState,
  draft: MaterialDraft,
  classification: ClassificationResult,
): RouteMaterialInputResult {
  const material: MaterialItem = {
    ...draft,
    id: `material-${state.materials.length + 1}`,
    submittedAt: new Date(0).toISOString(),
  };
  const patch: ProfilePatch = {
    id: `patch-${state.patches.length + 1}`,
    summary: `Stored ${draft.title} as context without updating profile state yet.`,
    impact: "No profile fields were updated because the signal is still too ambiguous.",
    status: "applied",
  };
  const analysis: MaterialAnalysis = {
    id: `analysis-${state.materialAnalysis.length + 1}`,
    materialType: draft.type,
    patchStatus: "applied",
    extractedFacts: [],
    affectedFields: ["currentFocus"],
    profileImpact: "This update was stored as context only and did not update profile fields yet.",
  };
  const nextState: DemoState = {
    ...state,
    materials: [material, ...state.materials],
    patches: [patch, ...state.patches],
    materialAnalysis: [analysis, ...state.materialAnalysis],
    conversation: [
      ...state.conversation,
      `Coach: I saved ${draft.title} as context, but I did not update profile fields yet because the signal is still too ambiguous.`,
    ],
  };

  return {
    state: nextState,
    latestPatch: patch,
    materialAnalysis: analysis,
    weeklyBrief: nextState.weeklyBrief,
    routing: {
      classification,
      responseMode: "summarize_no_write",
      writeExecuted: false,
      fallbackReason: null,
    },
  };
}

function buildNoWriteReply(state: DemoState, content: string): DemoCoachReply {
  return {
    goal: "clarify_profile",
    content,
    missingProfileFields: getMissingProfileFields(state),
    nextPromptType: "ask_profile_signal",
  };
}

function buildSafeSummary(state: DemoState, message: string): string {
  if (state.pendingPatch?.status === "needs_confirmation") {
    return "Before I tighten anything else, I still need to confirm which schools belong in your current shortlist.";
  }

  if (state.pendingPatch?.status === "conflict") {
    return "Before I tighten the plan, I still need one explicit choice on which testing baseline to trust.";
  }

  if (/worried|stress|stressed|confused|unclear|uncertain/i.test(message)) {
    return "I can help with that. Let's keep it simple and start with the most concrete thing we can lock first, then I can guide the next step from there.";
  }

  return "I can work with that, but I do not want to overwrite your profile from an ambiguous signal. Give me the most concrete update or the one question you want to solve first.";
}

function buildPendingStateSummary(state: DemoState, preferred?: string): string {
  if (state.pendingPatch?.status === "needs_confirmation") {
    return "Before I move into timing or strategy, I still need to confirm the shortlist itself.";
  }

  if (state.pendingPatch?.status === "conflict") {
    return "Before I move further, I still need you to settle which testing score should be treated as the trusted baseline.";
  }

  return preferred ?? "I can summarize the situation, but I am not going to update state from this step yet.";
}

export function buildDeterministicConversationClassification(
  state: DemoState,
  message: string,
): ClassificationResult {
  if (state.pendingPatch?.status === "needs_confirmation") {
    return {
      inputKind: "school_list_confirmation",
      journeyStage: "shortlist_confirmation",
      responseMode: "multi_select",
      writePermission: "proposal_allowed",
      candidateCardType: "multi_select",
      candidateAction: "confirm_pending_school_list",
      confidence: 1,
      reasonShort: "Pending shortlist confirmation dominates.",
    };
  }

  if (state.pendingPatch?.status === "conflict") {
    return {
      inputKind: "testing_conflict_resolution",
      journeyStage: "shortlist_confirmation",
      responseMode: "single_select",
      writePermission: "proposal_allowed",
      candidateCardType: "single_select",
      candidateAction: "resolve_pending_testing_conflict",
      confidence: 1,
      reasonShort: "Pending testing conflict dominates.",
    };
  }

  if (
    /\b(what now|what next|next step|next move|what should we do next|what should i do next|what do we do next|what to do next)\b/i.test(
      message,
    )
  ) {
    return {
      inputKind: "ask_next_step",
      journeyStage: "starter_clarity",
      responseMode: "chat_only",
      writePermission: "proposal_allowed",
      candidateCardType: "none",
      candidateAction: "apply_initial_guidance_checkpoint",
      confidence: 0.7,
      reasonShort: "The customer is asking for the next move.",
    };
  }

  if (/worried|stress|confused|unclear|uncertain/i.test(message)) {
    return {
      inputKind: "emotional_uncertainty",
      journeyStage: "starter_clarity",
      responseMode: "summarize_no_write",
      writePermission: "none",
      candidateCardType: "none",
      candidateAction: "none",
      confidence: 0.65,
      reasonShort: "The input is primarily emotional uncertainty.",
    };
  }

  return {
    inputKind: "unknown",
    journeyStage: "unknown",
    responseMode: "chat_only",
    writePermission: "proposal_allowed",
    candidateCardType: "none",
    candidateAction: "none",
    confidence: 0.2,
    reasonShort: "Deterministic fallback classification.",
  };
}

export function buildDeterministicMaterialClassification(draft: MaterialDraft): ClassificationResult {
  const inputKind: RoutingInputKind =
    draft.type === "school_list"
      ? "school_list_candidate"
      : draft.type === "test_score"
        ? "testing_update_signal"
        : "material_update_signal";
  const responseMode: RoutingResponseMode =
    draft.type === "school_list" ? "multi_select" : "chat_only";
  const candidateCardType: RoutingCardType =
    draft.type === "school_list" ? "multi_select" : "none";

  return {
    inputKind,
    journeyStage: "starter_clarity",
    responseMode,
    writePermission: "proposal_allowed",
    candidateCardType,
    candidateAction: "submit_material_draft",
    confidence: 0.8,
    reasonShort: "Deterministic fallback classification from material type.",
  };
}

function deriveResponseModeFromState(state: DemoState): RoutingResponseMode {
  const card = deriveDecisionCard(state);

  if (card?.type === "yes_no") {
    return "yes_no";
  }

  if (card?.type === "single_select") {
    return "single_select";
  }

  if (card?.type === "multi_select") {
    return "multi_select";
  }

  return "chat_only";
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

function isOpenAIRoutingEnabled(): boolean {
  return process.env.OPENAI_ROUTING_ENABLED === "true";
}

function isClassificationResult(value: unknown): value is ClassificationResult {
  return (
    isRecord(value) &&
    isRoutingInputKind(value.inputKind) &&
    isJourneyStage(value.journeyStage) &&
    isResponseMode(value.responseMode) &&
    isWritePermission(value.writePermission) &&
    isCardType(value.candidateCardType) &&
    isRoutingAction(value.candidateAction) &&
    typeof value.confidence === "number" &&
    typeof value.reasonShort === "string"
  );
}

function isResponseModelOutput(value: unknown): value is ResponseModelOutput {
  return (
    isRecord(value) &&
    typeof value.coachMessage === "string" &&
    typeof value.shouldWriteState === "boolean" &&
    typeof value.fallbackUsed === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasStringPayloadField(
  payload: ActionProposal["payload"],
  key: string,
): boolean {
  return Boolean(
    payload &&
      typeof payload[key] === "string" &&
      (payload[key] as string).trim().length > 0,
  );
}

function hasStringArrayPayloadField(
  payload: ActionProposal["payload"],
  key: string,
): boolean {
  if (!payload || !Array.isArray(payload[key])) {
    return false;
  }

  return (payload[key] as unknown[]).every(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
}

function readStringArrayPayloadField(
  payload: ActionProposal["payload"],
  key: string,
): string[] {
  if (!payload || !Array.isArray(payload[key])) {
    return [];
  }

  return (payload[key] as unknown[])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isRoutingInputKind(value: unknown): value is RoutingInputKind {
  return (
    typeof value === "string" &&
    [
      "starter_context",
      "starter_uncertainty",
      "ask_next_step",
      "material_update_signal",
      "school_list_candidate",
      "school_list_confirmation",
      "testing_update_signal",
      "testing_conflict_resolution",
      "school_bucket_input",
      "timing_strategy_input",
      "material_priority_input",
      "execution_progress_input",
      "execution_blocker_input",
      "blocker_resolved_input",
      "emotional_uncertainty",
      "off_topic",
      "unknown",
    ].includes(value)
  );
}

function isJourneyStage(value: unknown): value is RoutingJourneyStage {
  return (
    typeof value === "string" &&
    [
      "starter_clarity",
      "shortlist_confirmation",
      "school_bucketing",
      "timing_strategy",
      "proof_gap_closure",
      "material_priority",
      "monthly_execution",
      "unknown",
    ].includes(value)
  );
}

function isResponseMode(value: unknown): value is RoutingResponseMode {
  return (
    typeof value === "string" &&
    ["chat_only", "yes_no", "single_select", "multi_select", "summarize_no_write"].includes(value)
  );
}

function isWritePermission(value: unknown): value is RoutingWritePermission {
  return value === "none" || value === "proposal_allowed";
}

function isCardType(value: unknown): value is RoutingCardType {
  return value === "none" || value === "yes_no" || value === "single_select" || value === "multi_select";
}

function isRoutingAction(value: unknown): value is RoutingAction {
  return (
    typeof value === "string" &&
    [
      "none",
      "apply_initial_guidance_checkpoint",
      "submit_material_draft",
      "confirm_pending_school_list",
      "resolve_pending_testing_conflict",
      "apply_school_list_buckets",
      "apply_application_timing_strategy",
      "apply_story_material_priority",
      "apply_execution_progress",
      "apply_execution_blocker",
      "apply_ready_to_ship_actions",
    ].includes(value)
  );
}
