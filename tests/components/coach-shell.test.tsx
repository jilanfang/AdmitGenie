import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CoachShell } from "@/components/coach-shell";
import { continueDemoConversation } from "@/lib/domain/demo-contracts";
import { createInitialDemoState, submitMaterialDraft } from "@/lib/domain/demo-state";
import {
  DEMO_HOUSEHOLD_ID,
  DEMO_STUDENT_PROFILE_ID,
  type CoachSnapshot,
} from "@/lib/server/persistence";

function snapshotToState(snapshot: CoachSnapshot) {
  return {
    conversation: snapshot.conversation,
    materials: snapshot.materials,
    patches: snapshot.patches,
    pendingPatch: snapshot.pendingPatch,
    materialAnalysis: snapshot.materialAnalysis,
    profileFields: snapshot.profileFields,
    weeklyBrief: snapshot.weeklyBrief,
  };
}

function createStarterSnapshot(): CoachSnapshot {
  return {
    household: {
      id: DEMO_HOUSEHOLD_ID,
      timezone: "America/Los_Angeles",
      goalsSummary: "Selective North America admissions planning for an 11th-grade student.",
    },
    studentProfile: {
      id: DEMO_STUDENT_PROFILE_ID,
      firstName: "Demo Student",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "Selective engineering programs",
    },
    ...createInitialDemoState(),
  };
}

function advanceSnapshot(
  messages: string[],
): CoachSnapshot {
  let snapshot = createStarterSnapshot();

  snapshot = {
    ...snapshot,
    ...submitMaterialDraft(snapshotToState(snapshot), {
      type: "school_list",
      title: "Maybe schools",
      content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    }),
  };

  for (const message of messages) {
    snapshot = {
      ...snapshot,
      ...continueDemoConversation({
        state: snapshotToState(snapshot),
        message,
      }).state,
    };
  }

  return snapshot;
}

describe("CoachShell", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    const starterState = createInitialDemoState();
    const firstGenState = {
      ...starterState,
      conversation: [
        "I am seeing a motivated first-generation 11th grader with strong momentum, but the process still needs structure around school fit, affordability, and timing.",
        "Start with what matters most right now: the kind of schools you want, any budget limits, and whether testing is still on your list.",
      ],
      profileFields: {
        ...starterState.profileFields,
        testingStatus: {
          label: "Testing",
          value: "PSAT done, no official SAT / ACT submitted yet",
          status: "unconfirmed",
        },
        schoolList: {
          label: "School list",
          value: "A few school names exist, but there is no ranked list or affordability filter yet",
          status: "inferred",
        },
        currentFocus: {
          label: "Current focus",
          value: "Turn broad ambition into a first affordable school list and timeline",
          status: "inferred",
        },
      },
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
    };
    const starterSnapshot = {
      household: {
        id: DEMO_HOUSEHOLD_ID,
        timezone: "America/Los_Angeles",
        goalsSummary: "Selective North America admissions planning for an 11th-grade student.",
      },
      studentProfile: {
        id: DEMO_STUDENT_PROFILE_ID,
        firstName: "Demo Student",
        gradeLevel: "11th grade",
        graduationYear: "2027",
        majorDirection: "Selective engineering programs",
      },
      ...starterState,
    };
    const firstGenSnapshot = {
      household: {
        id: DEMO_HOUSEHOLD_ID,
        timezone: "America/Chicago",
        goalsSummary:
          "Translate strong academic momentum into a practical college strategy for a first-generation family.",
      },
      studentProfile: {
        id: DEMO_STUDENT_PROFILE_ID,
        firstName: "Maya",
        gradeLevel: "11th grade",
        graduationYear: "2027",
        majorDirection: "Business, economics, or public policy",
      },
      ...firstGenState,
    };
    const satState = submitMaterialDraft(starterState, {
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });
    const satSnapshot = {
      ...starterSnapshot,
      ...satState,
    };
    let currentSnapshot: CoachSnapshot = starterSnapshot;
    let selectedPersonaSlug = "strategic-stem-striver";
    const personaOptions = [
      {
        slug: "strategic-stem-striver",
        name: "Strategic STEM Striver",
        summary:
          "High-performing 11th-grade family aiming for selective engineering programs but still missing an anchored school list and official testing plan.",
      },
      {
        slug: "first-gen-ambition-builder",
        name: "First-Gen Ambition Builder",
        summary:
          "A first-generation college-bound family with strong grades and limited admissions context, needing structure more than motivation.",
      },
    ];
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith("/api/demo/state")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: currentSnapshot,
              demoPersona: {
                canSwitch: true,
                selectedSlug: selectedPersonaSlug,
                options: personaOptions,
              },
              deployment: {
                persistenceKind: "memory",
                hasDatabaseUrl: false,
                isDurable: false,
                readyForSharedDemo: false,
                blocker:
                  "Stable shared demo deployment requires DATABASE_URL so the app can persist state outside memory mode.",
              },
              capabilities: {
                materialTypes: ["test_score"],
                conversationGoals: ["clarify_profile"],
              },
            },
          }),
        );
      }

      if (url.endsWith("/api/demo/materials")) {
        const body =
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as { draft?: { type: string; title: string; content: string } })
            : null;
        const draft = body?.draft;

        if (
          !draft ||
          typeof draft.type !== "string" ||
          typeof draft.title !== "string" ||
          typeof draft.content !== "string"
        ) {
          throw new Error("Material request body was not shaped as expected in test.");
        }

        const nextState = submitMaterialDraft(snapshotToState(currentSnapshot), {
          type: draft.type as Parameters<typeof submitMaterialDraft>[1]["type"],
          title: draft.title,
          content: draft.content,
        });
        currentSnapshot = {
          ...currentSnapshot,
          ...nextState,
        };

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: currentSnapshot,
              latestPatch: nextState.patches[0] ?? null,
              materialAnalysis: nextState.materialAnalysis[0] ?? null,
              weeklyBrief: nextState.weeklyBrief,
            },
          }),
        );
      }

      if (url.endsWith("/api/demo/conversation")) {
        const body =
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as { message?: string })
            : null;
        const message = body?.message;

        if (typeof message !== "string") {
          throw new Error("Conversation request body was not shaped as expected in test.");
        }

        const result = continueDemoConversation({
          state: snapshotToState(currentSnapshot),
          message,
        });
        currentSnapshot = {
          ...currentSnapshot,
          ...result.state,
        };

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: currentSnapshot,
              reply: result.reply,
            },
          }),
        );
      }

      if (url.endsWith("/api/demo/persona")) {
        selectedPersonaSlug = "first-gen-ambition-builder";
        currentSnapshot = firstGenSnapshot;

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: currentSnapshot,
              demoPersona: {
                canSwitch: true,
                selectedSlug: selectedPersonaSlug,
                options: personaOptions,
              },
            },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? "GET"}`);
    }) as typeof fetch;

    vi.stubGlobal("__setCoachSnapshot", (snapshot: CoachSnapshot) => {
      currentSnapshot = snapshot;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.localStorage.clear();
    Reflect.deleteProperty(globalThis, "__setCoachSnapshot");
    vi.restoreAllMocks();
  });

  it("loads the inbox scaffold from the demo state api", async () => {
    render(<CoachShell />);

    expect(
      await screen.findByRole("heading", { name: /build your first admissions plan/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/I can help you build your first admissions plan through conversation/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByText(/What I know/i)).toBeInTheDocument();
    expect(screen.getByText(/What’s missing/i)).toBeInTheDocument();
    expect(screen.getByText(/Add material/i)).toBeInTheDocument();
    expect(screen.getByText(/ephemeral demo mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Demo status/i)).toBeInTheDocument();
    expect(screen.getByText(/Ephemeral local demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Scenario/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /weekly brief/i })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/demo\/state\?workspace=/),
      );
    });
  });

  it("lets a user open the current brief without requiring a material update", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /view current brief/i }));

    expect(await screen.findByText(/^Monthly brief$/i)).toBeInTheDocument();
    expect(screen.getByText(/What changed/i)).toBeInTheDocument();
    expect(screen.getByText(/starter profile/i)).toBeInTheDocument();
  });

  it("persists a workspace code in local storage and reuses it for demo requests", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    const storedWorkspace = window.localStorage.getItem("admitgenie-workspace");

    expect(storedWorkspace).toBeTruthy();
    expect(screen.getByText(new RegExp(storedWorkspace ?? ""))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`/api/demo/state\\?workspace=${storedWorkspace}`),
        ),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(`\"workspace\":\"${storedWorkspace}\"`),
        }),
      );
    });
  });

  it("starts a fresh workspace when the user clicks new chat", async () => {
    const user = userEvent.setup();
    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.246813579)
      .mockReturnValueOnce(0.975318642);

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    const originalWorkspace = window.localStorage.getItem("admitgenie-workspace");

    await user.click(screen.getByRole("button", { name: /^new chat$/i }));

    const nextWorkspace = window.localStorage.getItem("admitgenie-workspace");

    expect(nextWorkspace).toBeTruthy();
    expect(nextWorkspace).not.toBe(originalWorkspace);
    expect(screen.getByText(new RegExp(nextWorkspace ?? ""))).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/api/demo/state\\?workspace=${nextWorkspace}`)),
      );
    });

    randomSpy.mockRestore();
  });

  it("lets a user apply a sample SAT update through the api and see the brief change", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));

    expect(
      await screen.findByText(/Parsed SAT Math 760 and Reading and Writing 730/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Patch status: applied/i)).toBeInTheDocument();
    expect(screen.getByText(/Affected fields: testingStatus/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view latest brief/i })).toBeInTheDocument();
    expect(screen.getAllByText(/SAT Math 760 \/ RW 730/i).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("lets a user open the latest brief after an applied material update", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));
    await screen.findByRole("button", { name: /view latest brief/i });

    await user.click(screen.getByRole("button", { name: /view latest brief/i }));

    expect(await screen.findByText(/^Monthly brief$/i)).toBeInTheDocument();
    expect(await screen.findByText(/What changed/i)).toBeInTheDocument();
    expect(screen.getByText(/SAT results were added/i)).toBeInTheDocument();
    expect(screen.getByText(/What matters now/i)).toBeInTheDocument();
    expect(screen.getByText(/Top actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Why this advice/i)).toBeInTheDocument();
  });

  it("lets a user turn a first-run message into onboarding guidance through the conversation api", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.type(
      screen.getByLabelText(/message coach/i),
      "We want selective engineering programs but do not have a school list yet.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/Current understanding:/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Top priority this month:/i)).toBeInTheDocument();
    expect(screen.getByText(/What would sharpen the advice next:/i)).toBeInTheDocument();
    expect(screen.getByText(/Family: We want selective engineering programs/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/conversation",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("shows the deadline follow-up loop after shortlist bucketing", async () => {
    const user = userEvent.setup();
    const setCoachSnapshot = (globalThis as typeof globalThis & {
      __setCoachSnapshot?: (snapshot: CoachSnapshot) => void;
    }).__setCoachSnapshot;
    setCoachSnapshot?.(
      advanceSnapshot([
        "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
      ]),
    );

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });
    await screen.findByText(/bucketed school-list strategy with reach and target groups/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/Application timing/i)).toBeInTheDocument();
    expect(screen.getByText(/Early:/i)).toBeInTheDocument();
    expect(screen.getByText(/Regular:/i)).toBeInTheDocument();
    expect(screen.getByText(/Constraint: no binding early decision/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tightened the plan around early versus regular application pacing/i),
    ).toBeInTheDocument();
  });

  it("prioritizes confirmation language in chat after a pending school-list patch exists", async () => {
    const user = userEvent.setup();
    const setCoachSnapshot = (globalThis as typeof globalThis & {
      __setCoachSnapshot?: (snapshot: CoachSnapshot) => void;
    }).__setCoachSnapshot;
    const pendingSnapshot = createStarterSnapshot();
    setCoachSnapshot?.({
      ...pendingSnapshot,
      ...submitMaterialDraft(snapshotToState(pendingSnapshot), {
        type: "school_list",
        title: "Maybe schools",
        content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
      }),
    });

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });
    await screen.findByText(/Patch status: needs_confirmation/i);

    await user.type(screen.getByLabelText(/message coach/i), "What should I do next?");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/need to confirm the school list signal/i),
    ).toBeInTheDocument();
  });

  it("lets a demo operator switch to another persona scenario", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.selectOptions(screen.getByLabelText(/demo persona/i), "first-gen-ambition-builder");

    expect(await screen.findByText(/Maya/i)).toBeInTheDocument();
    expect(screen.getByText(/Business, economics, or public policy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/first affordable school list and timeline/i).length).toBeGreaterThan(
      0,
    );
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/persona",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("lets a user paste a custom material update and submit it", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "freeform_note");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Parent timeline concern");
    await user.type(
      screen.getByLabelText(/material content/i),
      "We are worried about balancing SAT prep with AP exams this spring.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));

    expect(
      (
        await screen.findAllByText(
          /Stored new freeform note material: Parent timeline concern/i,
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Patch status: applied/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"type\":\"freeform_note\""),
        }),
      );
    });
  });

  it("lets a user upload a text file as new material", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getAllByRole("button", { name: /upload file/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "activity_update");

    const fileInput = screen.getByLabelText(/file upload/i);
    const file = new File(
      ["Started a peer tutoring initiative for algebra and physics students."],
      "peer-tutoring.txt",
      { type: "text/plain" },
    );

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /add material/i }));

    expect(
      await screen.findByText(/Stored new activity update material: peer-tutoring.txt/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Patch status: applied/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"type\":\"activity_update\""),
        }),
      );
    });
  });

  it("shows a needs confirmation material analysis for an ambiguous school list update", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "school_list");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Maybe schools");
    await user.type(
      screen.getByLabelText(/material content/i),
      "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));

    expect(await screen.findByText(/Patch status: needs_confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/Affected fields: schoolList/i)).toBeInTheDocument();
    expect(screen.getByText(/Latest material update/i)).toBeInTheDocument();
  });

  it("shows a conflict material analysis when a new score contradicts known testing", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));
    await screen.findByText(/Patch status: applied/i);

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "test_score");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Conflicting SAT");
    await user.type(
      screen.getByLabelText(/material content/i),
      "Updated SAT update: Math 700, Reading and Writing 680.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));

    expect(await screen.findByText(/Patch status: conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/Affected fields: testingStatus/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view latest brief/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view latest brief/i }));

    expect(
      await screen.findByText(/Testing information is currently conflicting/i),
    ).toBeInTheDocument();
  });

  it("shows current priorities in the notebook without bringing back a full brief rail", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));

    expect(await screen.findByText(/Current priorities/i)).toBeInTheDocument();
    expect(screen.getByText(/Sort schools into reach, target, and safer-fit buckets/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Weekly Brief$/i)).not.toBeInTheDocument();
  });

  it("shifts to execution-oriented follow-up after a brief-driving applied update", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));
    await user.type(screen.getByLabelText(/message coach/i), "Thanks, what now?");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/the next execution step is your school list/i),
    ).toBeInTheDocument();
  });

  it("lets a user confirm a pending school list through chat and updates the notebook state", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "school_list");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Maybe schools");
    await user.type(
      screen.getByLabelText(/material content/i),
      "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));
    await screen.findByText(/Patch status: needs_confirmation/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/confirmed\. I updated your school list/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Purdue, Georgia Tech, UT Austin/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Patch status: needs_confirmation/i)).not.toBeInTheDocument();
  });

  it("lets a user resolve a testing conflict through chat and updates the testing profile", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));
    await screen.findByText(/Patch status: applied/i);

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "test_score");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Conflicting SAT");
    await user.type(
      screen.getByLabelText(/material content/i),
      "Updated SAT update: Math 700, Reading and Writing 680.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));
    await screen.findByText(/Patch status: conflict/i);

    await user.type(screen.getByLabelText(/message coach/i), "Use the newer 700 and 680 score.");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/resolved\. I updated the testing profile to the newer score/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SAT Math 700 \/ RW 680/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Patch status: conflict/i)).not.toBeInTheDocument();
  });

  it("lets a user continue from a confirmed shortlist into bucketed school-list execution", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "school_list");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Maybe schools");
    await user.type(
      screen.getByLabelText(/material content/i),
      "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));
    await screen.findByText(/Patch status: needs_confirmation/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText(/confirmed\. I updated your school list/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/bucketed school-list strategy with reach and target groups/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Reach: Purdue, Georgia Tech/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Target: UT Austin/i).length).toBeGreaterThan(0);
  });

  it("lets a user continue from timing strategy into story and material priorities", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });

    await user.click(screen.getAllByRole("button", { name: /paste update/i })[0]!);
    await user.selectOptions(screen.getByLabelText(/material type/i), "school_list");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Maybe schools");
    await user.type(
      screen.getByLabelText(/material content/i),
      "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));
    await screen.findByText(/Patch status: needs_confirmation/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText(/confirmed\. I updated your school list/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText(/bucketed school-list strategy with reach and target groups/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText(/captured that timing strategy/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/clearer story and material priority for the early-round schools/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Prioritize the highest-leverage stories and materials first/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/leadership and STEM project stories/i).length).toBeGreaterThan(0);
  });

  it("lets a user continue from story priorities into execution progress", async () => {
    const user = userEvent.setup();
    const setCoachSnapshot = (globalThis as typeof globalThis & {
      __setCoachSnapshot?: (snapshot: CoachSnapshot) => void;
    }).__setCoachSnapshot;
    setCoachSnapshot?.(
      advanceSnapshot([
        "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
      ]),
    );

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });
    await screen.findByText(/clearer story and material priority for the early-round schools/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/execution progress for the early-round materials is now real/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Purdue leadership story/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/robotics evidence for Georgia Tech/i).length).toBeGreaterThan(0);
  });

  it("lets a user continue from execution progress into blocker resolution", async () => {
    const user = userEvent.setup();
    const setCoachSnapshot = (globalThis as typeof globalThis & {
      __setCoachSnapshot?: (snapshot: CoachSnapshot) => void;
    }).__setCoachSnapshot;
    setCoachSnapshot?.(
      advanceSnapshot([
        "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
      ]),
    );

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });
    await screen.findByText(/execution progress for the early-round materials is now real/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "We are blocked because Purdue still needs a stronger leadership example and Georgia Tech needs clearer robotics proof.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/execution is blocked on a few specific proof gaps/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/stronger leadership example/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/clearer robotics proof/i).length).toBeGreaterThan(0);
  });

  it("lets a user continue from blocker resolution into ready-to-ship actions", async () => {
    const user = userEvent.setup();
    const setCoachSnapshot = (globalThis as typeof globalThis & {
      __setCoachSnapshot?: (snapshot: CoachSnapshot) => void;
    }).__setCoachSnapshot;
    setCoachSnapshot?.(
      advanceSnapshot([
        "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
        "We are blocked because Purdue still needs a stronger leadership example and Georgia Tech needs clearer robotics proof.",
      ]),
    );

    render(<CoachShell />);
    await screen.findByRole("heading", { name: /build your first admissions plan/i });
    await screen.findByText(/execution is blocked on a few specific proof gaps/i);

    await user.type(
      screen.getByLabelText(/message coach/i),
      "We now have the Purdue leadership example and clearer robotics proof for Georgia Tech, so those blockers are resolved.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/the early-round package is now close enough to move into final polishing and review/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/final polish/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/submission-ready/i).length).toBeGreaterThan(0);
  });
});
