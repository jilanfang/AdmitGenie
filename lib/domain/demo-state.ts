export type ProfileFieldStatus =
  | "known"
  | "inferred"
  | "unconfirmed"
  | "stale"
  | "conflicting";

export type MaterialType =
  | "transcript"
  | "test_score"
  | "activity_update"
  | "award"
  | "school_list"
  | "essay_note"
  | "freeform_note";

export type MaterialDraft = {
  type: MaterialType;
  title: string;
  content: string;
};

export type MaterialItem = MaterialDraft & {
  id: string;
  submittedAt: string;
};

export type ProfileField = {
  label: string;
  value: string;
  status: ProfileFieldStatus;
};

export type ProfilePatchStatus = "applied" | "needs_confirmation" | "conflict";

export type ProfilePatch = {
  id: string;
  summary: string;
  impact: string;
  status: ProfilePatchStatus;
};

export type WeeklyBrief = {
  whatChanged: string;
  whatMatters: string;
  topActions: string[];
  risks: string[];
  whyThisAdvice: string;
};

export type DemoProfileFields = {
  gradeLevel: ProfileField;
  testingStatus: ProfileField;
  schoolList: ProfileField;
  applicationTiming: ProfileField;
  currentFocus: ProfileField;
};

export type MaterialAnalysis = {
  id: string;
  materialType: MaterialType;
  patchStatus: ProfilePatchStatus;
  extractedFacts: string[];
  affectedFields: Array<keyof DemoProfileFields>;
  profileImpact: string;
};

export type DecisionCardType = "yes_no" | "single_select" | "multi_select";

export type DecisionCardOption = {
  id: string;
  label: string;
  description: string;
  value: string;
};

export type DecisionCard = {
  type: DecisionCardType;
  prompt: string;
  reason: string;
  options: DecisionCardOption[];
  appliesToPatchId: string;
  submitLabel: string;
};

export type SuggestedReply = {
  id: string;
  label: string;
  message: string;
};

export type DemoState = {
  conversation: string[];
  materials: MaterialItem[];
  patches: ProfilePatch[];
  pendingPatch: ProfilePatch | null;
  materialAnalysis: MaterialAnalysis[];
  profileFields: DemoProfileFields;
  weeklyBrief: WeeklyBrief;
};

export function createInitialDemoState(): DemoState {
  return {
    conversation: [
      "I already have a light starting point for your family: you are somewhere in the 9th-11th grade range, aiming high, but the school list and testing picture are still too fuzzy for strong advice.",
      "Let's make this simple. Tell me your grade, what feels most uncertain right now, and whether you already have a school list.",
    ],
    materials: [],
    patches: [],
    pendingPatch: null,
    materialAnalysis: [],
    profileFields: {
      gradeLevel: {
        label: "Grade",
        value: "11th grade",
        status: "known",
      },
      testingStatus: {
        label: "Testing",
        value: "No confirmed SAT / ACT details yet",
        status: "unconfirmed",
      },
      schoolList: {
        label: "School list",
        value: "No confirmed school list yet",
        status: "unconfirmed",
      },
      applicationTiming: {
        label: "Application timing",
        value: "No confirmed early vs regular application strategy yet",
        status: "unconfirmed",
      },
      currentFocus: {
        label: "Current focus",
        value: "Clarify goals and build the first monthly plan",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged: "We have a starter profile but no confirmed academic evidence yet.",
      whatMatters:
        "Confirm testing context and school list so the coach can produce sharper monthly guidance.",
      topActions: [
        "Tell the coach your current testing status.",
        "Add a school list or describe your target range.",
        "Share one recent activity or academic update.",
      ],
      risks: [
        "Without a school list, priorities stay broad.",
        "Without testing evidence, academic positioning remains fuzzy.",
      ],
      whyThisAdvice:
        "The highest-leverage next step is reducing uncertainty in the profile, especially around school list and testing status.",
    },
  };
}

export function createBlankStarterState(): DemoState {
  return {
    conversation: [
      "You are starting from a blank private case, which is good. We do not need a giant intake form. Give me the first real facts and I will turn them into a working plan.",
      "Start with any one of these: your current grade, what kind of colleges you are aiming at, what feels most unclear, or a score, school list, or update you already have.",
    ],
    materials: [],
    patches: [],
    pendingPatch: null,
    materialAnalysis: [],
    profileFields: {
      gradeLevel: {
        label: "Grade",
        value: "Not confirmed yet",
        status: "unconfirmed",
      },
      testingStatus: {
        label: "Testing",
        value: "No testing context shared yet",
        status: "unconfirmed",
      },
      schoolList: {
        label: "School list",
        value: "No school list shared yet",
        status: "unconfirmed",
      },
      applicationTiming: {
        label: "Application timing",
        value: "No deadline strategy confirmed yet",
        status: "unconfirmed",
      },
      currentFocus: {
        label: "Current focus",
        value: "Turn the first real facts into a usable admissions plan",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged: "This case starts from a blank starting point with no confirmed profile facts yet.",
      whatMatters:
        "The next gain comes from locking one or two real facts so the coach can stop speaking broadly and start guiding concretely.",
      topActions: [
        "Tell the coach your current grade.",
        "Share the main goal or uncertainty right now.",
        "Paste a score, school list, or recent update if you already have one.",
      ],
      risks: [
        "If the first facts stay vague, the next advice will stay broad.",
        "If no school list or testing context is shared, prioritization will remain provisional.",
      ],
      whyThisAdvice:
        "A blank case is useful only if it turns quickly into a working profile, so the first step is to confirm a small set of high-leverage facts.",
    },
  };
}

export function submitMaterialDraft(
  state: DemoState,
  draft: MaterialDraft,
): DemoState {
  const material: MaterialItem = {
    ...draft,
    id: `material-${state.materials.length + 1}`,
    submittedAt: new Date(0).toISOString(),
  };

  if (draft.type === "test_score") {
    return submitTestScoreMaterial(state, material);
  }

  if (draft.type === "school_list") {
    return submitSchoolListMaterial(state, material);
  }

  if (draft.type === "activity_update") {
    return submitActivityUpdateMaterial(state, material);
  }

  const patch: ProfilePatch = {
    id: `patch-${state.patches.length + 1}`,
    summary: `Stored new ${draft.type.replaceAll("_", " ")} material: ${draft.title}.`,
    impact: "This may refine the profile after manual confirmation.",
    status: "applied",
  };
  const analysis: MaterialAnalysis = {
    id: `analysis-${state.materialAnalysis.length + 1}`,
    materialType: draft.type,
    patchStatus: patch.status,
    extractedFacts: [],
    affectedFields: ["currentFocus"],
    profileImpact: patch.impact,
  };

  return {
    ...state,
    materials: [material, ...state.materials],
    patches: [patch, ...state.patches],
    pendingPatch: null,
    materialAnalysis: [analysis, ...state.materialAnalysis],
    conversation: [
      ...state.conversation,
      `Coach: ${patch.summary} ${patch.impact}`,
    ],
  };
}

export function confirmPendingSchoolList(state: DemoState): DemoState {
  const latestMaterial = state.materials[0];
  const extractedSchools =
    state.materialAnalysis[0]?.extractedFacts.length
      ? state.materialAnalysis[0].extractedFacts
      : parseSchoolList(latestMaterial?.content ?? "");
  const confirmedSchoolList = extractedSchools.join(", ") || latestMaterial?.title || "Confirmed school list";
  const impact =
    "The school list is now confirmed, so the coach can turn broad ambition into reach, target, and safer-fit planning.";

  return {
    ...state,
    pendingPatch: null,
    patches: updateLatestPatch(state.patches, {
      summary: `Confirmed school list from ${latestMaterial?.title ?? "the latest update"}.`,
      impact,
      status: "applied",
    }),
    materialAnalysis: updateLatestMaterialAnalysis(state.materialAnalysis, {
      patchStatus: "applied",
      profileImpact: impact,
    }),
    profileFields: {
      ...state.profileFields,
      schoolList: {
        label: "School list",
        value: confirmedSchoolList,
        status: "known",
      },
      currentFocus: {
        label: "Current focus",
        value: "Turn the confirmed school list into a sharper reach, target, and safer-fit plan",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "Your school list is now confirmed, giving the coach a real planning baseline instead of a rough signal.",
      whatMatters:
        "The next useful step is sorting that list into reach, target, and safer-fit buckets and checking where testing will matter most.",
      topActions: [
        "Tag each school as reach, target, or safer fit.",
        "Flag which schools are in-state, affordability-sensitive, or merit-dependent.",
        "Tell the coach which schools feel most emotionally important so priorities stay realistic.",
      ],
      risks: [
        "If the list is still early, some schools may need to be swapped once affordability becomes clearer.",
        "A confirmed list without bucket labels is still too vague for precise application pacing.",
      ],
      whyThisAdvice:
        "Once the school list is confirmed, the coach can move from generic planning into actual list strategy and timing decisions.",
    },
  };
}

export function resolvePendingTestingConflict(
  state: DemoState,
  selection: "latest" | "current",
): DemoState {
  const latestMaterial = state.materials[0];
  const latestScore = readTestingValueFromState(state);
  const resolvedValue =
    selection === "latest"
      ? latestScore ?? state.profileFields.testingStatus.value
      : state.profileFields.testingStatus.value;
  const changedToLatest = selection === "latest" && latestScore !== null;
  const impact = changedToLatest
    ? "The testing conflict is resolved, so the coach can trust the latest score and tighten fit guidance again."
    : "The testing conflict is resolved, and the coach is keeping the existing score as the trusted profile baseline.";

  return {
    ...state,
    pendingPatch: null,
    patches: updateLatestPatch(state.patches, {
      summary: changedToLatest
        ? `Resolved testing conflict and updated the profile to ${resolvedValue}.`
        : `Resolved testing conflict and kept the current testing profile at ${resolvedValue}.`,
      impact,
      status: "applied",
    }),
    materialAnalysis: updateLatestMaterialAnalysis(state.materialAnalysis, {
      patchStatus: "applied",
      profileImpact: impact,
    }),
    profileFields: {
      ...state.profileFields,
      testingStatus: {
        label: "Testing",
        value: resolvedValue,
        status: "known",
      },
      currentFocus: {
        label: "Current focus",
        value: "Use the resolved testing profile to sharpen school-fit and next-step planning",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged: changedToLatest
        ? "Testing was clarified and the newer SAT result is now the active profile baseline."
        : "Testing was clarified, and the coach is keeping the previously confirmed SAT result as the active baseline.",
      whatMatters:
        "With testing conflict out of the way, the next bottleneck is turning the school list into a clearer execution plan.",
      topActions: [
        "Sort schools into reach, target, and safer-fit buckets.",
        "Check where the resolved score changes competitiveness or testing strategy.",
        "Add one new activity or award so the profile stays balanced beyond academics.",
      ],
      risks: [
        "Even with testing resolved, the school list may still be too rough for precise planning.",
        "If the score context changes again, fit guidance can drift unless future updates stay consistent.",
      ],
      whyThisAdvice:
        "Resolving testing conflict restores trust in the academic baseline, which is necessary before the coach can give sharper school-fit guidance.",
    },
  };
}

export function deriveDecisionCard(state: DemoState): DecisionCard | null {
  if (state.pendingPatch?.status === "needs_confirmation") {
    const options = getLatestSchoolListOptions(state);

    if (options.length === 0) {
      return {
        type: "yes_no",
        prompt: "Is this your current shortlist?",
        reason:
          "I found school-list signals in your latest material, but I need a simple confirmation before I write them into your profile.",
        options: [
          {
            id: "yes",
            label: "Yes, use it",
            description: "Confirm this school list as the working shortlist.",
            value: "yes",
          },
          {
            id: "no",
            label: "No, not yet",
            description: "Keep this as brainstorming and do not update the shortlist.",
            value: "no",
          },
        ],
        appliesToPatchId: state.pendingPatch.id,
        submitLabel: "Confirm shortlist",
      };
    }

    return {
      type: "multi_select",
      prompt: "Pick the schools that belong in your current shortlist.",
      reason:
        "I found possible school names in your latest material. Confirm the real shortlist here instead of making you explain it from scratch.",
      options,
      appliesToPatchId: state.pendingPatch.id,
      submitLabel: "Confirm shortlist",
    };
  }

  if (state.pendingPatch?.status === "conflict") {
    const currentValue = state.profileFields.testingStatus.value;
    const latestValue = readTestingValueFromState(state);

    if (!latestValue) {
      return null;
    }

    return {
      type: "single_select",
      prompt: "Which testing baseline should I trust?",
      reason:
        "Your latest score update conflicts with the testing baseline already in the profile, so I need one explicit choice before I update guidance.",
      options: [
        {
          id: "latest",
          label: `Use latest: ${latestValue}`,
          description: "Replace the current testing baseline with the newest score update.",
          value: `Use the newer ${latestValue.replace("SAT Math ", "").replace(" / RW ", " and ")} score.`,
        },
        {
          id: "current",
          label: `Keep current: ${currentValue}`,
          description: "Ignore the new conflicting update and keep the existing baseline.",
          value: `Keep the current ${currentValue.replace("SAT Math ", "").replace(" / RW ", " and ")} score.`,
        },
      ],
      appliesToPatchId: state.pendingPatch.id,
      submitLabel: "Apply choice",
    };
  }

  return null;
}

export function deriveSuggestedReplies(state: DemoState): SuggestedReply[] {
  if (state.pendingPatch) {
    return [];
  }

  if (state.materialAnalysis.length > 0) {
    return [];
  }

  const hasOnlyOpeningTurns = state.conversation.length <= 2;

  if (!hasOnlyOpeningTurns) {
    return [];
  }

  return [
    {
      id: "grade",
      label: "I'm in 11th grade",
      message: "I'm in 11th grade and want to build a clear admissions plan.",
    },
    {
      id: "school-list",
      label: "We don't have a school list yet",
      message: "We do not have a school list yet and need help building one.",
    },
    {
      id: "test-score",
      label: "We have a new test score",
      message: "I have a new test score and want you to update the plan.",
    },
    {
      id: "affordability",
      label: "We're worried about affordability",
      message: "I'm worried about affordability and want the plan to reflect budget reality.",
    },
  ];
}

export function applySchoolListBuckets(
  state: DemoState,
  buckets: {
    reach: string[];
    target: string[];
    saferFit: string[];
  },
): DemoState {
  const schoolListValue = [
    buckets.reach.length > 0 ? `Reach: ${buckets.reach.join(", ")}` : null,
    buckets.target.length > 0 ? `Target: ${buckets.target.join(", ")}` : null,
    buckets.saferFit.length > 0 ? `Safer-fit: ${buckets.saferFit.join(", ")}` : null,
  ]
    .filter((section): section is string => section !== null)
    .join(" | ");

  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      schoolList: {
        label: "School list",
        value: schoolListValue || state.profileFields.schoolList.value,
        status: "known",
      },
      currentFocus: {
        label: "Current focus",
        value: "Turn school buckets into concrete application pacing, testing, and profile priorities",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "The school list is now bucketed into reach, target, and safer-fit groups, so guidance can move from broad planning into execution.",
      whatMatters:
        "With list buckets defined, the next step is comparing deadlines, testing expectations, and profile gaps across those schools.",
      topActions: [
        "Add one safer-fit option if the list still leans too reach-heavy.",
        "Compare testing policy and score sensitivity across the current target schools.",
        "Start matching activities and story angles to the schools that matter most.",
      ],
      risks: [
        "If the list stays too reach-heavy, the final portfolio may become strategically fragile.",
        "Bucket labels without deadline and affordability context still leave execution gaps.",
      ],
      whyThisAdvice:
        "Once the schools are bucketed, the coach can stop speaking in generalities and start prioritizing concrete application strategy.",
    },
  };
}

export function applyApplicationTimingStrategy(
  state: DemoState,
  timingSummary: string,
): DemoState {
  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      applicationTiming: {
        label: "Application timing",
        value: timingSummary,
        status: "known",
      },
      currentFocus: {
        label: "Current focus",
        value: "Turn deadline strategy into near-term application pacing and material priorities",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "Application timing is now clearer, so the coach can move from bucket strategy into deadline-aware execution.",
      whatMatters:
        "The next step is pacing materials around the early-round schools first, while keeping regular decision work from slipping.",
      topActions: [
        "List which early schools need materials ready first.",
        "Set a near-term deadline for essays, activity updates, and testing decisions.",
        "Keep regular decision schools moving so timing pressure does not create a late bottleneck.",
      ],
      risks: [
        "If early-round priorities stay vague, the strongest schools may get rushed materials.",
        "If regular decision schools are ignored for too long, the plan can become deadline-fragile later.",
      ],
      whyThisAdvice:
        "Once timing strategy is explicit, the coach can prioritize sequencing instead of only comparing school buckets.",
    },
  };
}

export function applyInitialGuidanceCheckpoint(
  state: DemoState,
  input: {
    currentFocus: string;
    weeklyBrief: WeeklyBrief;
  },
): DemoState {
  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      currentFocus: {
        label: "Current focus",
        value: input.currentFocus,
        status: "inferred",
      },
    },
    weeklyBrief: input.weeklyBrief,
  };
}

export function applyStoryMaterialPriority(
  state: DemoState,
  prioritySummary: string,
): DemoState {
  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      currentFocus: {
        label: "Current focus",
        value: `Prioritize the highest-leverage stories and materials first: ${prioritySummary}`,
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "Story and material priorities are now clearer, so the coach can push the most important application evidence first.",
      whatMatters:
        "The next step is building the strongest early-round narrative and material package before regular-decision work expands.",
      topActions: [
        "Draft the leadership and STEM project stories for the early-round schools first.",
        "Collect the activity details or proof points that make those stories credible.",
        "Leave lower-priority regular-decision material polishing until the early package is moving.",
      ],
      risks: [
        "If the strongest stories are not drafted early, the early-round schools may get generic materials.",
        "If too much attention shifts to later schools too soon, the early timeline can slip.",
      ],
      whyThisAdvice:
        "Once school timing is known, the coach should prioritize which stories and materials create the most leverage for the earliest applications.",
    },
  };
}

export function applyExecutionProgress(
  state: DemoState,
  progressSummary: string,
): DemoState {
  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      currentFocus: {
        label: "Current focus",
        value: `Execution is underway for the early-round package: ${progressSummary}`,
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "Execution progress is now visible, with real draft work and evidence collection underway for the early-round schools.",
      whatMatters:
        "The next step is finishing the strongest early-round stories and locking the supporting evidence before expanding lower-priority work.",
      topActions: [
        "Finish the Purdue leadership story draft to a usable version.",
        "Turn the robotics evidence for Georgia Tech into concrete bullet points or proof details.",
        "Keep lower-priority regular-decision work light until the early package is materially stronger.",
      ],
      risks: [
        "If draft progress stays partial, the early-round package may still look thinner than the school list ambition.",
        "If evidence is not turned into usable detail, strong activities may remain too generic in applications.",
      ],
      whyThisAdvice:
        "Once execution has started, the coach should shift from planning priorities into finishing the highest-leverage work with enough evidence to support it.",
    },
  };
}

export function applyExecutionBlocker(
  state: DemoState,
  blockerSummary: string,
): DemoState {
  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      currentFocus: {
        label: "Current focus",
        value: `Resolve the current execution blockers before the early-round package expands: ${blockerSummary}`,
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "Execution blockers are now explicit, especially around the missing leadership example and the robotics proof needed for the early-round schools.",
      whatMatters:
        "The next step is closing those proof gaps fast enough that the early-round story package becomes credible, not just well-planned.",
      topActions: [
        "Find one stronger leadership example for Purdue and turn it into a concrete anecdote.",
        "Turn the robotics proof for Georgia Tech into specific results, scope, or ownership details.",
        "Do not broaden the workstream until those missing proof points are usable in the early package.",
      ],
      risks: [
        "If the leadership example stays vague, Purdue materials may read as generic rather than earned.",
        "If the robotics proof stays weak, Georgia Tech materials may sound claimed rather than evidenced.",
      ],
      whyThisAdvice:
        "Once the blocker is visible, the coach should stop broad planning and push directly on the missing proof that limits application quality.",
    },
  };
}

export function applyReadyToShipActions(
  state: DemoState,
  resolutionSummary: string,
): DemoState {
  return {
    ...state,
    profileFields: {
      ...state.profileFields,
      currentFocus: {
        label: "Current focus",
        value: `The early-round package is ready for final polish and submission prep: ${resolutionSummary}`,
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged:
        "The key blockers are resolved, so the early-round package can move into final polish, review, and submission-ready preparation.",
      whatMatters:
        "The next step is tightening language, checking evidence placement, and making the strongest early applications submission-ready without reopening broad planning.",
      topActions: [
        "Do a final polish pass on the Purdue leadership story.",
        "Make the Georgia Tech robotics proof concise, specific, and submission-ready.",
        "Run one final review pass across the early-round package before submission.",
      ],
      risks: [
        "If final polish is skipped, resolved blockers may still leave the materials sounding rough or uneven.",
        "If the package re-expands into broad strategy again, momentum toward early submission can slip.",
      ],
      whyThisAdvice:
        "Once the missing proof is resolved, the coach should move from issue-solving into final polish and submission readiness, not reopen earlier planning loops.",
    },
  };
}

function submitTestScoreMaterial(state: DemoState, material: MaterialItem): DemoState {
  const parsedScore = parseSatScore(material.content);

  if (!parsedScore) {
    const patch = buildPatch(state, {
      summary: `Stored new test score material: ${material.title}.`,
      impact: "This needs confirmation because the score details could not be parsed confidently.",
      status: "needs_confirmation",
    });
    const analysis = buildAnalysis(state, {
      materialType: material.type,
      patchStatus: patch.status,
      extractedFacts: [],
      affectedFields: ["testingStatus"],
      profileImpact: patch.impact,
    });

    return {
      ...state,
      materials: [material, ...state.materials],
      patches: [patch, ...state.patches],
      pendingPatch: patch,
      materialAnalysis: [analysis, ...state.materialAnalysis],
      conversation: [
        ...state.conversation,
        "Coach: I stored your new testing update, but I still need a clearer score format before I can safely update the testing profile.",
      ],
    };
  }

  const nextTestingValue = `SAT Math ${parsedScore.math} / RW ${parsedScore.readingWriting}`;
  const isConflict =
    state.profileFields.testingStatus.status === "known" &&
    state.profileFields.testingStatus.value !== nextTestingValue;

  const patch = buildPatch(state, {
    summary: isConflict
      ? `New score update conflicts with the current testing profile: ${nextTestingValue}.`
      : `Parsed SAT Math ${parsedScore.math} and Reading and Writing ${parsedScore.readingWriting} from the new score update.`,
    impact: isConflict
      ? "This needs confirmation before the testing profile can be changed."
      : "This improves academic positioning and may tighten next-step advice for selective targets.",
    status: isConflict ? "conflict" : "applied",
  });
  const analysis = buildAnalysis(state, {
    materialType: material.type,
    patchStatus: patch.status,
    extractedFacts: [`SAT Math ${parsedScore.math}`, `RW ${parsedScore.readingWriting}`],
    affectedFields: ["testingStatus"],
    profileImpact: patch.impact,
  });

  if (isConflict) {
    return {
      ...state,
      materials: [material, ...state.materials],
      patches: [patch, ...state.patches],
      pendingPatch: patch,
      materialAnalysis: [analysis, ...state.materialAnalysis],
      conversation: [
        ...state.conversation,
        `Coach: I found a score update that conflicts with your current testing profile. I read ${nextTestingValue}, but I am keeping your existing testing state until you confirm which score is correct.`,
      ],
      weeklyBrief: {
        ...state.weeklyBrief,
        risks: [
          "Testing information is currently conflicting, so fit guidance may be less reliable until confirmed.",
          ...state.weeklyBrief.risks,
        ].slice(0, 3),
      },
    };
  }

  return {
    ...state,
    materials: [material, ...state.materials],
    patches: [patch, ...state.patches],
    pendingPatch: null,
    materialAnalysis: [analysis, ...state.materialAnalysis],
      conversation: [
        ...state.conversation,
        `Coach: I found a new SAT update: ${nextTestingValue}. I used that to strengthen your academic profile and update your current guidance.`,
      ],
    profileFields: {
      ...state.profileFields,
      testingStatus: {
        label: "Testing",
        value: nextTestingValue,
        status: "known",
      },
    },
    weeklyBrief: {
      whatChanged:
        "SAT results were added, giving the coach a stronger academic read on the profile.",
      whatMatters:
        "With testing now confirmed, the next bottleneck is making the school list precise enough to match ambition with timing.",
      topActions: [
        "Sort schools into reach, target, and safer-fit buckets.",
        "Check whether each target school is test-required, test-optional, or score-sensitive.",
        "Share one new activity or award so the profile is not over-indexed on academics.",
      ],
      risks: [
        "Academic readiness may now be stronger than the rest of the profile evidence.",
        "Without a confirmed school list, improved scores cannot fully change priorities.",
      ],
      whyThisAdvice:
        "The new SAT result changes your academic positioning, so the coach can now give more grounded guidance on school fit and next steps.",
    },
  };
}

function submitSchoolListMaterial(state: DemoState, material: MaterialItem): DemoState {
  const listedSchools = parseSchoolList(material.content);
  const isAmbiguous = /\bmaybe|might|probably|a few|some options\b/i.test(material.content);
  const patch = buildPatch(state, {
    summary: isAmbiguous
      ? `I found a possible school list in ${material.title}, but it does not look confirmed yet.`
      : `Captured a new school list from ${material.title}.`,
    impact: isAmbiguous
      ? "This could change list strategy, but I need confirmation before I replace the current school-list state."
      : "This gives the coach a clearer school-list starting point.",
    status: isAmbiguous ? "needs_confirmation" : "applied",
  });
  const analysis = buildAnalysis(state, {
    materialType: material.type,
    patchStatus: patch.status,
    extractedFacts: listedSchools,
    affectedFields: ["schoolList"],
    profileImpact: patch.impact,
  });

  if (isAmbiguous) {
    return {
      ...state,
      materials: [material, ...state.materials],
      patches: [patch, ...state.patches],
      pendingPatch: patch,
      materialAnalysis: [analysis, ...state.materialAnalysis],
      conversation: [
        ...state.conversation,
        `Coach: I found a possible school list in ${material.title}. I can see ${listedSchools.join(", ") || "several schools"}, but I need to know whether this is your real shortlist before I update your planning state.`,
      ],
    };
  }

  return {
    ...state,
    materials: [material, ...state.materials],
    patches: [patch, ...state.patches],
    pendingPatch: null,
    materialAnalysis: [analysis, ...state.materialAnalysis],
    conversation: [
      ...state.conversation,
      "Coach: I added your school list and will use it to sharpen your reach, target, and safer-fit guidance.",
    ],
    profileFields: {
      ...state.profileFields,
      schoolList: {
        label: "School list",
        value: listedSchools.join(", ") || material.title,
        status: "known",
      },
    },
  };
}

function submitActivityUpdateMaterial(state: DemoState, material: MaterialItem): DemoState {
  const summary = summarizeActivityUpdate(material.content);
  const patch = buildPatch(state, {
    summary: `Stored new activity update material: ${material.title}.`,
    impact: "This adds fresher activity evidence to the student profile.",
    status: "applied",
  });
  const analysis = buildAnalysis(state, {
    materialType: material.type,
    patchStatus: patch.status,
    extractedFacts: summary ? [summary] : [],
    affectedFields: ["currentFocus"],
    profileImpact: patch.impact,
  });

  return {
    ...state,
    materials: [material, ...state.materials],
    patches: [patch, ...state.patches],
    pendingPatch: null,
    materialAnalysis: [analysis, ...state.materialAnalysis],
    conversation: [
      ...state.conversation,
      "Coach: I stored your new activity update and will use it to strengthen the non-academic side of your profile.",
    ],
    profileFields: {
      ...state.profileFields,
      currentFocus: {
        label: "Current focus",
        value: "Use recent activity evidence to sharpen positioning and next steps",
        status: "inferred",
      },
    },
  };
}

function buildPatch(
  state: DemoState,
  input: Omit<ProfilePatch, "id">,
): ProfilePatch {
  return {
    id: `patch-${state.patches.length + 1}`,
    ...input,
  };
}

function buildAnalysis(
  state: DemoState,
  input: Omit<MaterialAnalysis, "id">,
): MaterialAnalysis {
  return {
    id: `analysis-${state.materialAnalysis.length + 1}`,
    ...input,
  };
}

function parseSatScore(content: string): { math: string; readingWriting: string } | null {
  const mathMatch = content.match(/math\D*(\d{3})/i);
  const rwMatch = content.match(/(?:reading(?:\s+and\s+writing)?|rw)\D*(\d{3})/i);

  if (!mathMatch?.[1] || !rwMatch?.[1]) {
    return null;
  }

  return {
    math: mathMatch[1],
    readingWriting: rwMatch[1],
  };
}

function parseSchoolList(content: string): string[] {
  return content
    .split(/,|\n/)
    .map((item) =>
      item
        .trim()
        .replace(/^and\s+/i, "")
        .replace(/^(maybe\s+)?(some\s+options\s+are|options\s+are|thinking\s+about|considering)\s+/i, "")
        .replace(/^a\s+few\s+/i, "")
        .trim(),
    )
    .filter((item) => item.length > 0)
    .slice(0, 5);
}

function getLatestSchoolListOptions(state: DemoState): DecisionCardOption[] {
  const extractedSchools =
    state.materialAnalysis[0]?.extractedFacts.length
      ? state.materialAnalysis[0].extractedFacts
      : parseSchoolList(state.materials[0]?.content ?? "");

  return extractedSchools.map((school, index) => ({
    id: `school-${index + 1}`,
    label: school,
    description: "Include this school in the current working shortlist.",
    value: school,
  }));
}

function summarizeActivityUpdate(content: string): string | null {
  const normalized = content.trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return null;
  }

  return normalized.slice(0, 120);
}

function updateLatestPatch(
  patches: ProfilePatch[],
  updates: Partial<ProfilePatch>,
): ProfilePatch[] {
  if (patches.length === 0 || !patches[0]) {
    return patches;
  }

  return [{ ...patches[0], ...updates }, ...patches.slice(1)];
}

function updateLatestMaterialAnalysis(
  analyses: MaterialAnalysis[],
  updates: Partial<MaterialAnalysis>,
): MaterialAnalysis[] {
  if (analyses.length === 0 || !analyses[0]) {
    return analyses;
  }

  return [{ ...analyses[0], ...updates }, ...analyses.slice(1)];
}

function readTestingValueFromState(state: DemoState): string | null {
  const facts = state.materialAnalysis[0]?.extractedFacts ?? [];
  const math = facts.find((fact) => /SAT Math/i.test(fact))?.match(/(\d{3})/)?.[1];
  const readingWriting = facts.find((fact) => /\bRW\b/i.test(fact))?.match(/(\d{3})/)?.[1];

  if (math && readingWriting) {
    return `SAT Math ${math} / RW ${readingWriting}`;
  }

  const parsedScore = parseSatScore(state.materials[0]?.content ?? "");

  if (!parsedScore) {
    return null;
  }

  return `SAT Math ${parsedScore.math} / RW ${parsedScore.readingWriting}`;
}
