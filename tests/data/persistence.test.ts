import {
  conversations,
  households,
  materialItems,
  profilePatches,
  studentProfiles,
  weeklyBriefs,
} from "@/db/schema";
import {
  DEMO_HOUSEHOLD_ID,
  DEMO_STUDENT_PROFILE_ID,
  buildDrizzleSeedPayload,
  createPersistenceAdapter,
  getDemoDeploymentStatus,
  hydrateDemoStateFromPersistenceRows,
  type PersistenceAdapter,
} from "@/lib/server/persistence";

describe("database schema exports", () => {
  it("defines the core MVP persistence tables", () => {
    expect(households).toBeDefined();
    expect(studentProfiles).toBeDefined();
    expect(conversations).toBeDefined();
    expect(materialItems).toBeDefined();
    expect(profilePatches).toBeDefined();
    expect(weeklyBriefs).toBeDefined();
  });
});

describe("persistence adapter selection", () => {
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
      return;
    }

    delete process.env.DATABASE_URL;
  });

  it("uses the memory adapter when no database url is configured", () => {
    delete process.env.DATABASE_URL;

    const adapter = createPersistenceAdapter();

    expect(adapter.kind).toBe("memory");
  });

  it("uses the drizzle adapter when a database url is configured", () => {
    process.env.DATABASE_URL = "postgres://demo:demo@localhost:5432/admitgenie";

    const adapter = createPersistenceAdapter();

    expect(adapter.kind).toBe("drizzle");
  });

  it("reports memory mode as not ready for a stable shared demo", () => {
    delete process.env.DATABASE_URL;

    const status = getDemoDeploymentStatus();

    expect(status.persistenceKind).toBe("memory");
    expect(status.hasDatabaseUrl).toBe(false);
    expect(status.isDurable).toBe(false);
    expect(status.readyForSharedDemo).toBe(false);
    expect(status.blocker).toMatch(/database_url/i);
  });

  it("reports drizzle mode as ready for a stable shared demo", () => {
    process.env.DATABASE_URL = "postgres://demo:demo@localhost:5432/admitgenie";

    const status = getDemoDeploymentStatus();

    expect(status.persistenceKind).toBe("drizzle");
    expect(status.hasDatabaseUrl).toBe(true);
    expect(status.isDurable).toBe(true);
    expect(status.readyForSharedDemo).toBe(true);
    expect(status.blocker).toBeNull();
  });
});

describe("memory persistence adapter", () => {
  it("returns a durable starter snapshot with the core entities", async () => {
    delete process.env.DATABASE_URL;

    const adapter = createPersistenceAdapter();
    const snapshot = await adapter.getCoachSnapshot();

    expect(adapter.kind).toBe("memory");
    expect(snapshot.household.id).toBe(DEMO_HOUSEHOLD_ID);
    expect(snapshot.household.timezone).toBe("America/Los_Angeles");
    expect(snapshot.studentProfile.id).toBe(DEMO_STUDENT_PROFILE_ID);
    expect(snapshot.studentProfile.gradeLevel).toBe("11th grade");
    expect(snapshot.conversation.length).toBeGreaterThan(0);
    expect(snapshot.weeklyBrief.whatChanged).toContain("starter profile");
    expect(snapshot.materials).toEqual([]);
    expect(snapshot.patches).toEqual([]);
  });

  it("stores a material submission and reflects the resulting patch", async () => {
    delete process.env.DATABASE_URL;

    const adapter: PersistenceAdapter = createPersistenceAdapter();
    const result = await adapter.submitMaterial({
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });

    expect(result.latestPatch?.summary).toContain("SAT Math 760");
    expect(result.state.materials).toHaveLength(1);
    expect(result.state.weeklyBrief.whatChanged).toContain("SAT");
  });
});

describe("drizzle persistence helpers", () => {
  it("builds starter seed rows for conversation and the first brief", () => {
    const seed = buildDrizzleSeedPayload();

    expect(seed.household.id).toBe(DEMO_HOUSEHOLD_ID);
    expect(seed.studentProfile.id).toBe(DEMO_STUDENT_PROFILE_ID);
    expect(seed.studentProfile.householdId).toBe(DEMO_HOUSEHOLD_ID);
    expect(seed.conversations).toHaveLength(2);
    expect(seed.conversations[0]?.householdId).toBe(DEMO_HOUSEHOLD_ID);
    expect(seed.conversations[0]?.studentProfileId).toBe(DEMO_STUDENT_PROFILE_ID);
    expect(seed.weeklyBrief.generationReason).toBe("starter_profile");
  });

  it("derives isolated durable ids for different workspaces", () => {
    const alpha = buildDrizzleSeedPayload("alpha");
    const beta = buildDrizzleSeedPayload("beta");

    expect(alpha.household.id).not.toBe(beta.household.id);
    expect(alpha.studentProfile.id).not.toBe(beta.studentProfile.id);
    expect(alpha.household.id).toContain("alpha");
    expect(beta.household.id).toContain("beta");
  });

  it("keeps all seeded relationships aligned to the requested workspace", () => {
    const seed = buildDrizzleSeedPayload("demo-room");

    expect(seed.studentProfile.householdId).toBe(seed.household.id);
    expect(seed.household.primaryStudentId).toBe(seed.studentProfile.id);
    expect(seed.conversations.every((item) => item.householdId === seed.household.id)).toBe(
      true,
    );
    expect(
      seed.conversations.every((item) => item.studentProfileId === seed.studentProfile.id),
    ).toBe(true);
    expect(seed.weeklyBrief.studentProfileId).toBe(seed.studentProfile.id);
  });

  it("hydrates demo state from persisted core rows", () => {
    const hydrated = hydrateDemoStateFromPersistenceRows({
      conversations: [
        {
          id: "conversation-2",
          householdId: DEMO_HOUSEHOLD_ID,
          studentProfileId: DEMO_STUDENT_PROFILE_ID,
          role: "coach",
          content: "I found a new SAT update and refreshed your guidance.",
          conversationGoal: "confirm_patch",
          createdAt: new Date("2026-03-22T14:00:00.000Z"),
        },
      ],
      materialItems: [
        {
          id: "material-1",
          householdId: DEMO_HOUSEHOLD_ID,
          studentProfileId: DEMO_STUDENT_PROFILE_ID,
          materialType: "test_score",
          sourceChannel: "coach_inbox",
          blobUrl: null,
          rawText: "New SAT update: Math 760, Reading and Writing 730.",
          userLabel: "March SAT",
          ingestionStatus: "applied",
          submittedAt: new Date("2026-03-22T13:59:00.000Z"),
        },
      ],
      profilePatches: [
        {
          id: "patch-1",
          studentProfileId: DEMO_STUDENT_PROFILE_ID,
          triggerSourceType: "material",
          triggerSourceId: "material-1",
          patchSummary: "Parsed SAT Math 760 and Reading and Writing 730 from the new score update.",
          patchPayloadJson: {
            testingStatus: "SAT Math 760 / RW 730",
          },
          status: "applied",
          impactSummary:
            "This improves academic positioning and may tighten next-step advice for selective targets.",
          createdAt: new Date("2026-03-22T14:00:00.000Z"),
          resolvedAt: null,
        },
      ],
      weeklyBriefs: [
        {
          id: "brief-1",
          studentProfileId: DEMO_STUDENT_PROFILE_ID,
          weekStartDate: "2026-03-16",
          whatChanged:
            "SAT results were added, giving the coach a stronger academic read on the profile.",
          whatMatters:
            "With testing now confirmed, the next bottleneck is making the school list precise enough to match ambition with timing.",
          topActionsJson: [
            "Sort schools into reach, target, and safer-fit buckets.",
          ],
          risksJson: [
            "Without a confirmed school list, improved scores cannot fully change priorities.",
          ],
          whyThisAdvice:
            "The new SAT result changes your academic positioning, so the coach can now give more grounded guidance on school fit and next steps.",
          generationReason: "material_update",
          createdAt: new Date("2026-03-22T14:00:00.000Z"),
        },
      ],
    });

    expect(hydrated.materials[0]?.title).toBe("March SAT");
    expect(hydrated.patches[0]?.summary).toContain("SAT Math 760");
    expect(hydrated.weeklyBrief.whatChanged).toContain("SAT results were added");
    expect(hydrated.profileFields.testingStatus.status).toBe("known");
    expect(hydrated.household.id).toBe(DEMO_HOUSEHOLD_ID);
    expect(hydrated.studentProfile.id).toBe(DEMO_STUDENT_PROFILE_ID);
    expect(hydrated.conversation[0]).toContain("SAT update");
  });

});
