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

export type ProfilePatch = {
  id: string;
  summary: string;
  impact: string;
  status: "applied";
};

export type WeeklyBrief = {
  whatChanged: string;
  whatMatters: string;
  topActions: string[];
  risks: string[];
  whyThisAdvice: string;
};

export type DemoState = {
  conversation: string[];
  materials: MaterialItem[];
  patches: ProfilePatch[];
  profileFields: {
    gradeLevel: ProfileField;
    testingStatus: ProfileField;
    schoolList: ProfileField;
    currentFocus: ProfileField;
  };
  weeklyBrief: WeeklyBrief;
};

export function createInitialDemoState(): DemoState {
  return {
    conversation: [
      "Welcome back. I am starting from a light profile: 11th-grade family, likely interested in selective schools, but the school list and testing details still need confirmation.",
      "Guided interview: tell me your grade, what feels most uncertain right now, and whether you already have a school list.",
    ],
    materials: [],
    patches: [],
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
      currentFocus: {
        label: "Current focus",
        value: "Clarify goals and build first weekly plan",
        status: "inferred",
      },
    },
    weeklyBrief: {
      whatChanged: "We have a starter profile but no confirmed academic evidence yet.",
      whatMatters:
        "Confirm testing context and school list so the coach can produce sharper weekly guidance.",
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
    const patch: ProfilePatch = {
      id: `patch-${state.patches.length + 1}`,
      summary:
        "Parsed SAT Math 760 and Reading and Writing 730 from the new score update.",
      impact:
        "This improves academic positioning and may tighten next-step advice for selective targets.",
      status: "applied",
    };

    return {
      ...state,
      materials: [material, ...state.materials],
      patches: [patch, ...state.patches],
      conversation: [
        "I found a new SAT update: SAT Math 760 and Reading and Writing 730. I used that to strengthen your academic profile and update this week's guidance.",
        ...state.conversation,
      ],
      profileFields: {
        ...state.profileFields,
        testingStatus: {
          label: "Testing",
          value: "SAT Math 760 / RW 730",
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

  const patch: ProfilePatch = {
    id: `patch-${state.patches.length + 1}`,
    summary: `Stored new ${draft.type.replaceAll("_", " ")} material: ${draft.title}.`,
    impact: "This may refine the profile after manual confirmation.",
    status: "applied",
  };

  return {
    ...state,
    materials: [material, ...state.materials],
    patches: [patch, ...state.patches],
  };
}

