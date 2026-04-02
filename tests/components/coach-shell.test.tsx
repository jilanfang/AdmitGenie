import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoachShell } from "@/components/coach-shell";
import { continueDemoConversation } from "@/lib/domain/demo-contracts";
import {
  createInitialDemoState,
  deriveDecisionCard,
  deriveSuggestedReplies,
  submitMaterialDraft,
  type DemoState,
} from "@/lib/domain/demo-state";
import {
  DEMO_HOUSEHOLD_ID,
  DEMO_STUDENT_PROFILE_ID,
  type CaseReadinessStatus,
  type CoachSnapshot,
} from "@/lib/server/persistence";

function snapshotToState(snapshot: CoachSnapshot): DemoState {
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

function withUiState(snapshot: CoachSnapshot): CoachSnapshot {
  const state = snapshotToState(snapshot);

  return {
    ...snapshot,
    decisionCard: deriveDecisionCard(state),
    suggestedReplies: deriveSuggestedReplies(state),
  };
}

function createSnapshotFromState(state: DemoState): CoachSnapshot {
  return withUiState({
    caseRecord: {
      id: "pilot-family-case",
      slug: "ava-chen-family",
      displayName: "Ava Chen",
      summary:
        "11th-grade engineering applicant with strong academics, but the family still needs a sharper list, testing baseline, and affordability-aware plan.",
      latestStatus: "Starter context captured and ready for the next useful decision.",
      oneNextMove: "Share the first shortlist or the newest material update.",
    },
    household: {
      id: DEMO_HOUSEHOLD_ID,
      timezone: "America/Los_Angeles",
      goalsSummary:
        "Selective North America admissions planning for an 11th-grade student.",
    },
    studentProfile: {
      id: DEMO_STUDENT_PROFILE_ID,
      firstName: "Ava",
      gradeLevel: "11th grade",
      graduationYear: "2027",
      majorDirection: "Selective engineering programs",
    },
    ...state,
    decisionCard: null,
    suggestedReplies: [],
  });
}

function createStarterSnapshot(): CoachSnapshot {
  return createSnapshotFromState(createInitialDemoState());
}

function createPrivateStarterSnapshot(): CoachSnapshot {
  return withUiState({
    caseRecord: {
      id: "private-case-demo",
      slug: "private-case-demo",
      displayName: "New admissions plan",
      summary: "A blank private case that will be shaped through conversation.",
      latestStatus: "The case is brand new and ready for the first real input.",
      oneNextMove: "Share your grade, goals, or biggest uncertainty.",
    },
    household: {
      id: "workspace-private-case-demo-household",
      timezone: "America/Los_Angeles",
      goalsSummary: "Blank private case",
    },
    studentProfile: {
      id: "workspace-private-case-demo-student",
      firstName: null,
      gradeLevel: "Not confirmed yet",
      graduationYear: null,
      majorDirection: null,
    },
    ...createInitialDemoState(),
    profileFields: {
      ...createInitialDemoState().profileFields,
      gradeLevel: {
        label: "Grade",
        value: "Not confirmed yet",
        status: "unconfirmed",
      },
    },
    weeklyBrief: {
      whatChanged: "This case starts from a blank starting point with no confirmed profile facts yet.",
      whatMatters:
        "Share the first real context so the coach can turn this blank case into a working plan.",
      topActions: [
        "Tell the coach your current grade.",
        "Share your biggest admissions concern.",
        "Paste a school list or recent update if you already have one.",
      ],
      risks: [
        "If the first facts stay vague, the advice will stay broad.",
      ],
      whyThisAdvice:
        "The case is intentionally blank, so the fastest way to value is to lock one or two core facts first.",
    },
    decisionCard: null,
    suggestedReplies: deriveSuggestedReplies(createInitialDemoState()),
  });
}

function createReadinessStatus(): CaseReadinessStatus {
  return {
    persistenceKind: "drizzle",
    databaseReady: true,
    openAiConfigured: true,
    durableMode: true,
    blobConfigured: false,
    requestCap: 120,
    blocker: null,
  };
}

function installCaseFetchMock(initialSnapshot: CoachSnapshot) {
  let currentSnapshot = withUiState(initialSnapshot);

  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/case/state") {
      return Response.json({
        ok: true,
        data: {
          state: currentSnapshot,
          readiness: createReadinessStatus(),
        },
      });
    }

    if (url === "/api/case/conversation") {
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

      currentSnapshot = withUiState({
        ...currentSnapshot,
        ...result.state,
      });

      return Response.json({
        ok: true,
        data: {
          state: currentSnapshot,
          reply: result.reply,
        },
      });
    }

    if (url === "/api/case/materials") {
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as {
              draft?: {
                type?: string;
                title?: string;
                content?: string;
              };
            })
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

      const result = submitMaterialDraft(snapshotToState(currentSnapshot), {
        type: draft.type as Parameters<typeof submitMaterialDraft>[1]["type"],
        title: draft.title,
        content: draft.content,
      });

      currentSnapshot = withUiState({
        ...currentSnapshot,
        ...result,
      });

      return Response.json({
        ok: true,
        data: {
          state: currentSnapshot,
          latestPatch: currentSnapshot.patches[0] ?? null,
          materialAnalysis: currentSnapshot.materialAnalysis[0] ?? null,
          weeklyBrief: currentSnapshot.weeklyBrief,
        },
      });
    }

    throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? "GET"}`);
  }) as typeof fetch;

  return {
    getSnapshot() {
      return currentSnapshot;
    },
  };
}

function mockDesktopLayout() {
  const originalMatchMedia = window.matchMedia;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(min-width: 1100px)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  return () => {
    window.matchMedia = originalMatchMedia;
  };
}

describe("CoachShell", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    installCaseFetchMock(createStarterSnapshot());
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads the external POC shell from the case api", async () => {
    render(<CoachShell />);

    expect(await screen.findByText(/Where should we start\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open case details/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open attachment options/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^send$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I'm in 11th grade/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /We don't have a school list yet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Demo status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^new chat$/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/case/state");
    });
  });

  it("shows a private return link in the case rail for a user-created case", async () => {
    installCaseFetchMock(createPrivateStarterSnapshot());
    window.history.replaceState({}, "", "/?invite=private-access-demo&entry=private");

    render(<CoachShell />);

    expect(await screen.findByText(/Where should we start\?/i)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: /open case details/i }));

    expect(await screen.findByText(/Private return link/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/\?invite=private-access-demo&entry=private/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy link/i })).toBeInTheDocument();
  });

  it("opens the compact case rail on smaller screens", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/Where should we start\?/i);

    expect(screen.queryByText(/Case summary/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open case details/i }));

    expect(await screen.findByText(/Case summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Ava Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/Latest status/i)).toBeInTheDocument();
    expect(screen.getByText(/One next move/i)).toBeInTheDocument();
  });

  it("shows the case rail docked on desktop layouts", async () => {
    const restoreMatchMedia = mockDesktopLayout();

    render(<CoachShell />);
    await screen.findByText(/Where should we start\?/i);

    expect(screen.queryByRole("button", { name: /open case details/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Case summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Active case/i)).toBeInTheDocument();

    restoreMatchMedia();
  });

  it("lets the user start from a suggested reply card", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/Where should we start\?/i);

    await user.click(screen.getByRole("button", { name: /We don't have a school list yet/i }));

    expect(
      await screen.findByText(/We do not have a school list yet and need help building one\./i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/case/conversation",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(
            "\"message\":\"We do not have a school list yet and need help building one.\"",
          ),
        }),
      );
    });
  });

  it("lets the user paste a material update and keeps the analysis inside the chat flow", async () => {
    const user = userEvent.setup();

    render(<CoachShell />);
    await screen.findByText(/Where should we start\?/i);

    await user.click(screen.getByRole("button", { name: /open attachment options/i }));
    await user.click(screen.getByRole("button", { name: /paste an update/i }));
    await user.selectOptions(screen.getByLabelText(/material type/i), "test_score");
    await user.type(screen.getByLabelText(/title/i), "March SAT");
    await user.type(
      screen.getByLabelText(/material content/i),
      "New SAT update: Math 760, Reading and Writing 730.",
    );
    await user.click(screen.getByRole("button", { name: /share with coach/i }));

    expect(await screen.findByText(/Saved and summarized/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Parsed SAT Math 760 and Reading and Writing 730 from the new score update\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see why i am taking this angle/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /see why i am taking this angle/i }));
    expect(await screen.findByText(/What changed:/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/case/materials",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"title\":\"March SAT\""),
        }),
      );
    });
  });

  it("uses a chat card to confirm a pending shortlist", async () => {
    const user = userEvent.setup();
    const seededState = submitMaterialDraft(createInitialDemoState(), {
      type: "school_list",
      title: "Maybe schools",
      content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    });

    installCaseFetchMock(createSnapshotFromState(seededState));
    render(<CoachShell />);

    expect(
      await screen.findByText(/Pick the schools that belong in your current shortlist\./i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Purdue/i }));
    await user.click(screen.getByRole("button", { name: /Georgia Tech/i }));
    await user.click(screen.getByRole("button", { name: /UT Austin/i }));
    await user.click(screen.getByRole("button", { name: /confirm shortlist/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/case/conversation",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(
            "\"message\":\"Yes, that is our current shortlist. Please use Purdue, Georgia Tech, UT Austin.\"",
          ),
        }),
      );
    });

    expect(screen.queryByText(/One thing to confirm/i)).not.toBeInTheDocument();
  });

  it("uses a chat card to resolve a testing conflict", async () => {
    const user = userEvent.setup();
    const withBaseline = submitMaterialDraft(createInitialDemoState(), {
      type: "test_score",
      title: "February SAT",
      content: "New SAT update: Math 730, Reading and Writing 700.",
    });
    const withConflict = submitMaterialDraft(withBaseline, {
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });

    installCaseFetchMock(createSnapshotFromState(withConflict));
    render(<CoachShell />);

    expect(await screen.findByText(/Which testing baseline should I trust\?/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Use latest:/i }));
    await user.click(screen.getByRole("button", { name: /apply choice/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/case/conversation",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"message\":\"Use the newer 760 and 730 score.\""),
        }),
      );
    });
  });

  it("shows a stable user-facing error when the conversation endpoint returns a non-json failure", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "/api/case/state") {
        return Response.json({
          ok: true,
          data: {
            state: createPrivateStarterSnapshot(),
            readiness: createReadinessStatus(),
          },
        });
      }

      if (url === "/api/case/conversation") {
        return new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        });
      }

      throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? "GET"}`);
    }) as typeof fetch;

    render(<CoachShell privateReturnUrl="/?invite=private-access-demo&entry=private" />);
    await screen.findByText(/Where should we start\?/i);

    await user.click(screen.getByRole("button", { name: /I'm in 11th grade/i }));

    expect(
      await screen.findByText(/We could not send that message right now\. Please try again\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected end of JSON input/i)).not.toBeInTheDocument();
  });
});
