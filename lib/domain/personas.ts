import {
  createInitialDemoState,
  type DemoState,
  type MaterialDraft,
  type ProfileFieldStatus,
} from "@/lib/domain/demo-state";

export type PersonaUserType = "student_family";

export type AdmitGeniePersona = {
  slug: string;
  name: string;
  summary: string;
  regionFocus: "North America";
  primaryUser: PersonaUserType;
  household: {
    timezone: string;
    goalsSummary: string;
  };
  studentProfile: {
    firstName: string;
    gradeLevel: string;
    graduationYear: string;
    majorDirection: string;
    testingSummary: string;
    profileConfidence: "starter" | "growing";
  };
  schoolListSummary: string;
  schoolListStatus: ProfileFieldStatus;
  currentFocus: string;
  keyTensions: string[];
  coachingOpening: string;
  guidedInterviewPrompt: string;
  weeklyBrief: DemoState["weeklyBrief"];
  sampleMaterials: MaterialDraft[];
};

export type PersonaOption = Pick<AdmitGeniePersona, "slug" | "name" | "summary">;

export const DEFAULT_PERSONA_SLUG = "strategic-stem-striver";

export const ADMITGENIE_PERSONAS: AdmitGeniePersona[] = [
  {
    slug: "strategic-stem-striver",
    name: "Strategic STEM Striver",
    summary:
      "High-performing 11th-grade family aiming for selective engineering programs but still missing an anchored school list and official testing plan.",
    regionFocus: "North America",
    primaryUser: "student_family",
    household: {
      timezone: "America/Los_Angeles",
      goalsSummary: "Selective North America admissions planning for a college-bound student in grades 9-11.",
    },
    studentProfile: {
      firstName: "Demo Student",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "Selective engineering programs",
      testingSummary: "No confirmed SAT / ACT details yet",
      profileConfidence: "starter",
    },
    schoolListSummary: "No confirmed school list yet",
    schoolListStatus: "unconfirmed",
    currentFocus: "Confirm testing timing and build the first engineering-heavy school list",
    keyTensions: [
      "The family wants ambitious engineering targets, but the school list is still too vague.",
      "Testing is still unconfirmed, which weakens reach-versus-target guidance.",
    ],
    coachingOpening:
      "Welcome back. I am starting from a light profile: a college-bound family targeting selective engineering programs, but the school list and testing details still need confirmation.",
    guidedInterviewPrompt:
      "Guided interview: tell me your grade, what feels most uncertain right now, whether you have a school list, and how far along you are on testing.",
    weeklyBrief: {
      whatChanged:
        "We have a starter profile for a selective engineering applicant, but no confirmed academic evidence yet.",
      whatMatters:
        "Confirm testing context and school list so the coach can produce sharper engineering-focused guidance this month.",
      topActions: [
        "Tell the coach your current SAT / ACT plan or latest official result.",
        "Add 6-10 schools so the coach can separate reach, target, and safer-fit options.",
        "Share one recent technical activity, project, or competition update.",
      ],
      risks: [
        "Without a school list, selectivity advice stays broad.",
        "Without testing evidence, academic positioning remains fuzzy for engineering-heavy targets.",
      ],
      whyThisAdvice:
        "The highest-leverage next step is reducing uncertainty in testing and school-list fit so the coach can give tighter engineering admissions guidance.",
    },
    sampleMaterials: [
      {
        type: "test_score",
        title: "March SAT",
        content: "New SAT update: Math 760, Reading and Writing 730.",
      },
      {
        type: "activity_update",
        title: "Robotics lead role",
        content: "Became mechanical lead for FRC robot redesign and organized three weekend build sessions.",
      },
    ],
  },
  {
    slug: "first-gen-ambition-builder",
    name: "First-Gen Ambition Builder",
    summary:
      "A first-generation college-bound family with strong grades and limited admissions context, needing structure more than motivation.",
    regionFocus: "North America",
    primaryUser: "student_family",
    household: {
      timezone: "America/Chicago",
      goalsSummary: "Translate strong academic momentum into a practical college strategy for a first-generation family.",
    },
    studentProfile: {
      firstName: "Maya",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "Business, economics, or public policy",
      testingSummary: "PSAT done, no official SAT / ACT submitted yet",
      profileConfidence: "starter",
    },
    schoolListSummary: "A few school names exist, but there is no ranked list or affordability filter yet",
    schoolListStatus: "inferred",
    currentFocus: "Turn broad ambition into a first affordable school list and timeline",
    keyTensions: [
      "The student is ambitious, but the family lacks confidence in how selective schools, scholarships, and timelines work.",
      "They need a practical plan that feels legible to both student and parent.",
    ],
    coachingOpening:
      "I am seeing a motivated first-generation family with strong momentum, but the process still needs structure around school fit, affordability, and timing.",
    guidedInterviewPrompt:
      "Start with what matters most right now: the kind of schools you want, any budget limits, and whether testing is still on your list.",
    weeklyBrief: {
      whatChanged:
        "We have a starter profile with strong ambition, but the school list and affordability assumptions are still rough.",
      whatMatters:
        "The next useful step is building a first school list that balances ambition, cost, and application workload.",
      topActions: [
        "Name 5-8 schools you are already considering.",
        "Tell the coach if scholarship pressure or in-state value matters most.",
        "Share one leadership or service story that the coach can use as a profile anchor.",
      ],
      risks: [
        "Without an affordability lens, the list may drift toward schools that do not fit the family's reality.",
        "Without a real list, every next step stays abstract.",
      ],
      whyThisAdvice:
        "This family needs the coach to reduce process ambiguity and turn ambition into a realistic admissions plan.",
    },
    sampleMaterials: [
      {
        type: "school_list",
        title: "Initial school brainstorm",
        content: "UT Austin, Texas A&M, Rice, Emory, UVA, Georgetown.",
      },
      {
        type: "award",
        title: "State DECA finalist",
        content: "Placed as a state finalist in DECA business finance event.",
      },
    ],
  },
  {
    slug: "story-rich-humanities-builder",
    name: "Story-Rich Humanities Builder",
    summary:
      "A humanities-leaning student with strong writing and extracurricular texture, but uneven profile packaging and school-fit clarity.",
    regionFocus: "North America",
    primaryUser: "student_family",
    household: {
      timezone: "America/New_York",
      goalsSummary: "Shape a compelling humanities applicant story without losing rigor or timeline discipline.",
    },
    studentProfile: {
      firstName: "Ava",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "History, political science, or public affairs",
      testingSummary: "ACT planning is underway, but the family has not shared an official score yet",
      profileConfidence: "growing",
    },
    schoolListSummary: "A few humanities-friendly schools are in mind, but there is no clear reach-target-safe structure yet",
    schoolListStatus: "inferred",
    currentFocus: "Convert broad narrative strengths into a sharper school-fit story and action plan",
    keyTensions: [
      "The student has real narrative material, but the profile risks feeling scattered instead of intentionally spiky.",
      "The family wants selective schools but has not translated that into list strategy or evidence priorities.",
    ],
    coachingOpening:
      "This looks like a student with strong story material and humanities direction, but the list strategy and evidence packaging still need work.",
    guidedInterviewPrompt:
      "Tell me which subjects or causes feel most central to you right now, what schools are in your head, and whether testing is still unresolved.",
    weeklyBrief: {
      whatChanged:
        "We have a starter profile with visible humanities direction, but the school list and proof points still need structure.",
      whatMatters:
        "The coach should narrow the school list and identify which activities best support a coherent humanities profile.",
      topActions: [
        "Share the first 5 schools you are drawn to and why.",
        "Add one debate, writing, research, or civic-engagement update.",
        "Clarify whether ACT testing will remain part of the plan.",
      ],
      risks: [
        "Without clearer packaging, the profile may read as busy instead of purposeful.",
        "Without a list, narrative strengths cannot be translated into fit-based advice.",
      ],
      whyThisAdvice:
        "For humanities-focused families, the coach has to shape coherence early so later essays and school choices reinforce each other.",
    },
    sampleMaterials: [
      {
        type: "essay_note",
        title: "Grandmother immigration story",
        content: "Wants to connect family immigration history to interest in public policy and oral history work.",
      },
      {
        type: "activity_update",
        title: "Debate captain",
        content: "Became debate captain and started weekly novice coaching sessions.",
      },
    ],
  },
  {
    slug: "balanced-premed-planner",
    name: "Balanced Pre-Med Planner",
    summary:
      "A science-focused student with solid service and academics who needs the coach to balance rigor, service narrative, and school-list realism.",
    regionFocus: "North America",
    primaryUser: "student_family",
    household: {
      timezone: "America/Toronto",
      goalsSummary: "Build a practical North America life-sciences admissions path with strong execution discipline.",
    },
    studentProfile: {
      firstName: "Noah",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "Biology, neuroscience, or pre-health pathways",
      testingSummary: "AP-heavy schedule shared, but SAT / ACT decision still unclear",
      profileConfidence: "growing",
    },
    schoolListSummary: "The family has a few biology-heavy programs in mind, but no balanced list yet",
    schoolListStatus: "unconfirmed",
    currentFocus: "Balance service, science rigor, and a realistic first life-sciences school list",
    keyTensions: [
      "The profile is balanced, but that balance may not feel distinctive without clearer positioning.",
      "The family needs help deciding whether testing effort is worth it relative to the rest of the profile.",
    ],
    coachingOpening:
      "I see a strong science-and-service profile, but the application strategy still needs sharper choices around school fit and testing.",
    guidedInterviewPrompt:
      "Tell me whether medicine or health science is the main direction, what schools are on your radar, and whether testing is still in play.",
    weeklyBrief: {
      whatChanged:
        "We have a starter profile with science depth and service, but testing and list strategy still need confirmation.",
      whatMatters:
        "The coach should decide whether testing adds leverage and which schools best fit a balanced pre-health profile.",
      topActions: [
        "List 5-8 biology or pre-health programs you are considering.",
        "Add one clinical, service, or research experience update.",
        "Tell the coach whether SAT / ACT prep is active or likely to be skipped.",
      ],
      risks: [
        "A balanced profile can look generic if the strongest health-related signal is not made explicit.",
        "Without a real list, the coach cannot judge where testing effort matters.",
      ],
      whyThisAdvice:
        "This persona needs the coach to keep options open while still creating a differentiated science-and-service story.",
    },
    sampleMaterials: [
      {
        type: "activity_update",
        title: "Hospital volunteer",
        content: "Completed 80 hours of hospital volunteering and helped onboard new volunteers.",
      },
      {
        type: "freeform_note",
        title: "Testing decision",
        content: "Family is unsure whether to prioritize ACT prep or keep focus on AP exams and research.",
      },
    ],
  },
  {
    slug: "trajectory-rebounder",
    name: "Trajectory Rebounder",
    summary:
      "A student whose profile improved sharply after an uneven earlier period and now needs the coach to frame trajectory, not just raw stats.",
    regionFocus: "North America",
    primaryUser: "student_family",
    household: {
      timezone: "America/Los_Angeles",
      goalsSummary: "Rebuild confidence and package an upward-trend profile into a credible selective-school plan.",
    },
    studentProfile: {
      firstName: "Jordan",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "Computer science, design, or interdisciplinary tech",
      testingSummary: "Student says scores are improving, but no official report has been uploaded yet",
      profileConfidence: "growing",
    },
    schoolListSummary: "The family has hopeful targets in mind, but the list is emotionally driven and not yet calibrated",
    schoolListStatus: "inferred",
    currentFocus: "Frame the upward trend clearly and turn hopeful targets into a calibrated list",
    keyTensions: [
      "The family worries older weaker grades will dominate the story.",
      "The coach needs enough evidence to show upward momentum without overpromising outcomes.",
    ],
    coachingOpening:
      "I see real upward momentum here, but the coach still needs clearer evidence and a more calibrated school list before the advice can get specific.",
    guidedInterviewPrompt:
      "Start with what changed recently: grades, testing, activities, or goals. Then tell me which schools feel most important right now.",
    weeklyBrief: {
      whatChanged:
        "We have a starter profile with visible upward trajectory, but the evidence for that rebound still needs to be organized.",
      whatMatters:
        "The most important step is proving momentum with concrete updates and using that to build a realistic target list.",
      topActions: [
        "Upload the newest grade or score update that shows the rebound.",
        "List the schools you feel most attached to right now.",
        "Add one project or leadership example from the stronger recent period.",
      ],
      risks: [
        "If the rebound is not documented well, the profile may be read through older weaker signals.",
        "If the school list is purely aspirational, execution can become chaotic.",
      ],
      whyThisAdvice:
        "This persona needs the coach to transform improvement into evidence and then turn that evidence into realistic decisions.",
    },
    sampleMaterials: [
      {
        type: "transcript",
        title: "Junior year progress report",
        content: "Semester grades improved to mostly As after a mixed sophomore year.",
      },
      {
        type: "activity_update",
        title: "App launch",
        content: "Built and launched a small scheduling app used by 120 students in the club network.",
      },
    ],
  },
];

export function getDefaultPersona(): AdmitGeniePersona {
  return getPersonaBySlug(DEFAULT_PERSONA_SLUG);
}

export function getPersonaBySlug(slug: string): AdmitGeniePersona {
  return (
    ADMITGENIE_PERSONAS.find((persona) => persona.slug === slug) ??
    ADMITGENIE_PERSONAS[0]
  ) as AdmitGeniePersona;
}

export function isPersonaSlug(value: string): boolean {
  return ADMITGENIE_PERSONAS.some((persona) => persona.slug === value);
}

export function listPersonaOptions(): PersonaOption[] {
  return ADMITGENIE_PERSONAS.map(({ slug, name, summary }) => ({
    slug,
    name,
    summary,
  }));
}

export function buildPersonaDemoState(slug: string = DEFAULT_PERSONA_SLUG): DemoState {
  const persona = getPersonaBySlug(slug);
  const starterState = createInitialDemoState();

  return {
    ...starterState,
    conversation: [persona.coachingOpening, persona.guidedInterviewPrompt],
    profileFields: {
      gradeLevel: {
        label: "Grade",
        value: persona.studentProfile.gradeLevel,
        status: "known",
      },
      testingStatus: {
        label: "Testing",
        value: persona.studentProfile.testingSummary,
        status: "unconfirmed",
      },
      schoolList: {
        label: "School list",
        value: persona.schoolListSummary,
        status: persona.schoolListStatus,
      },
      applicationTiming: starterState.profileFields.applicationTiming,
      currentFocus: {
        label: "Current focus",
        value: persona.currentFocus,
        status: "inferred",
      },
    },
    weeklyBrief: persona.weeklyBrief,
  };
}
