import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CoachShell } from "@/components/coach-shell";
import { createInitialDemoState, submitMaterialDraft } from "@/lib/domain/demo-state";
import {
  DEMO_HOUSEHOLD_ID,
  DEMO_STUDENT_PROFILE_ID,
} from "@/lib/server/persistence";

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

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/demo/state")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: starterSnapshot,
              demoPersona: {
                canSwitch: true,
                selectedSlug: "strategic-stem-striver",
                options: [
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
                ],
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

        const nextState = submitMaterialDraft(starterState, {
          type: draft.type as Parameters<typeof submitMaterialDraft>[1]["type"],
          title: draft.title,
          content: draft.content,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: {
                ...starterSnapshot,
                ...nextState,
              },
              latestPatch: nextState.patches[0] ?? null,
              weeklyBrief: nextState.weeklyBrief,
            },
          }),
        );
      }

      if (url.endsWith("/api/demo/conversation")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: {
                ...starterSnapshot,
                conversation: [
                  "Coach: I can work with that starting point. The next two gaps are your school list and testing status, because those two fields most directly change the first useful brief and the coach's reach-versus-fit guidance.",
                  "Family: We want selective engineering programs but do not have a school list yet.",
                  ...starterState.conversation,
                ],
              },
              reply: {
                goal: "clarify_profile",
                content:
                  "I can work with that starting point. The next two gaps are your school list and testing status, because those two fields most directly change the first useful brief and the coach's reach-versus-fit guidance.",
                missingProfileFields: ["testingStatus", "schoolList"],
              },
            },
          }),
        );
      }

      if (url.endsWith("/api/demo/persona")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              state: firstGenSnapshot,
              demoPersona: {
                canSwitch: true,
                selectedSlug: "first-gen-ambition-builder",
                options: [
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
                ],
              },
            },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? "GET"}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads the inbox scaffold from the demo state api", async () => {
    render(<CoachShell />);

    expect(
      await screen.findByRole("heading", { name: /coach inbox/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/AI-native guided interview/i)).toBeInTheDocument();
    expect(screen.getByText(/Demo Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Class of 2027/i)).toBeInTheDocument();
    expect(screen.getByText(/Selective engineering programs/i)).toBeInTheDocument();
    expect(screen.getByText(/America\/Los_Angeles/i)).toBeInTheDocument();
    expect(screen.getByText(/ephemeral demo mode/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload file/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/demo/state");
    });
  });

  it("lets a user apply a sample SAT update through the api and see the brief change", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/AI-native guided interview/i);

    await user.click(screen.getByRole("button", { name: /try a sat update/i }));

    expect(
      await screen.findByText(/Parsed SAT Math 760 and Reading and Writing 730/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/what changed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The new SAT result changes your academic positioning/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("lets a user send a guided planning update through the conversation api", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/AI-native guided interview/i);

    await user.click(screen.getByRole("button", { name: /share planning update/i }));

    expect(
      await screen.findByText(/The next two gaps are your school list and testing status/i),
    ).toBeInTheDocument();
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

  it("lets a demo operator switch to another persona scenario", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/AI-native guided interview/i);

    await user.selectOptions(screen.getByLabelText(/demo persona/i), "first-gen-ambition-builder");

    expect(await screen.findByText(/Maya/i)).toBeInTheDocument();
    expect(screen.getByText(/America\/Chicago/i)).toBeInTheDocument();
    expect(screen.getByText(/Business, economics, or public policy/i)).toBeInTheDocument();
    expect(
      screen.getByText(/balances ambition, cost, and application workload/i),
    ).toBeInTheDocument();
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
    await screen.findByText(/AI-native guided interview/i);

    await user.click(screen.getByRole("button", { name: /paste update/i }));
    await user.selectOptions(screen.getByLabelText(/material type/i), "freeform_note");
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Parent timeline concern");
    await user.type(
      screen.getByLabelText(/material content/i),
      "We are worried about balancing SAT prep with AP exams this spring.",
    );
    await user.click(screen.getByRole("button", { name: /add material/i }));

    expect(
      await screen.findByText(/Stored new freeform note material: Parent timeline concern/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            draft: {
              type: "freeform_note",
              title: "Parent timeline concern",
              content: "We are worried about balancing SAT prep with AP exams this spring.",
            },
          }),
        }),
      );
    });
  });

  it("lets a user upload a text file as new material", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/AI-native guided interview/i);

    await user.click(screen.getByRole("button", { name: /upload file/i }));
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
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/demo/materials",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            draft: {
              type: "activity_update",
              title: "peer-tutoring.txt",
              content: "Started a peer tutoring initiative for algebra and physics students.",
            },
          }),
        }),
      );
    });
  });
});
