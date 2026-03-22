import { desc, eq } from "drizzle-orm";

import { createDatabaseConnection, type AdmitGenieDatabase } from "@/db";
import {
  conversations,
  households,
  materialItems,
  profilePatches,
  studentProfiles,
  weeklyBriefs,
} from "@/db/schema";
import {
  applyDemoMaterial,
  continueDemoConversation,
  getDemoCapabilities,
} from "@/lib/domain/demo-contracts";
import {
  createInitialDemoState,
  type DemoState,
  type MaterialDraft,
  type MaterialType,
} from "@/lib/domain/demo-state";
import {
  DEFAULT_PERSONA_SLUG,
  buildPersonaDemoState,
  getDefaultPersona,
  getPersonaBySlug,
  isPersonaSlug,
  listPersonaOptions,
} from "@/lib/domain/personas";

export const DEMO_HOUSEHOLD_ID = "demo-household";
export const DEMO_STUDENT_PROFILE_ID = "demo-student";
const DEMO_SOURCE_CHANNEL = "coach_inbox";

type ConversationRow = typeof conversations.$inferSelect;
type ConversationInsert = typeof conversations.$inferInsert;
type HouseholdRow = typeof households.$inferSelect;
type HouseholdInsert = typeof households.$inferInsert;
type MaterialRow = typeof materialItems.$inferSelect;
type MaterialInsert = typeof materialItems.$inferInsert;
type ProfilePatchRow = typeof profilePatches.$inferSelect;
type ProfilePatchInsert = typeof profilePatches.$inferInsert;
type StudentProfileRow = typeof studentProfiles.$inferSelect;
type StudentProfileInsert = typeof studentProfiles.$inferInsert;
type WeeklyBriefRow = typeof weeklyBriefs.$inferSelect;
type WeeklyBriefInsert = typeof weeklyBriefs.$inferInsert;

type PersistedCoreRows = {
  households?: HouseholdRow[];
  studentProfiles?: StudentProfileRow[];
  conversations: ConversationRow[];
  materialItems: MaterialRow[];
  profilePatches: ProfilePatchRow[];
  weeklyBriefs: WeeklyBriefRow[];
};

export type CoachHousehold = {
  id: string;
  timezone: string;
  goalsSummary: string | null;
};

export type CoachStudentProfile = {
  id: string;
  firstName: string | null;
  gradeLevel: string;
  graduationYear: string | null;
  majorDirection: string | null;
};

export type CoachSnapshot = {
  household: CoachHousehold;
  studentProfile: CoachStudentProfile;
  conversation: DemoState["conversation"];
  materials: DemoState["materials"];
  patches: DemoState["patches"];
  weeklyBrief: DemoState["weeklyBrief"];
  profileFields: DemoState["profileFields"];
};

export type DemoPersonaConfig = {
  canSwitch: boolean;
  selectedSlug: string;
  options: ReturnType<typeof listPersonaOptions>;
};

export type DemoDeploymentStatus = {
  persistenceKind: PersistenceAdapter["kind"];
  hasDatabaseUrl: boolean;
  isDurable: boolean;
  readyForSharedDemo: boolean;
  blocker: string | null;
};

export type PersistenceAdapter = {
  kind: "memory" | "drizzle";
  canSwitchPersonas: boolean;
  getCoachSnapshot: () => Promise<CoachSnapshot>;
  getSelectedPersonaSlug: () => string;
  switchPersona: (slug: string) => Promise<CoachSnapshot>;
  submitConversation: (message: string) => Promise<{
    state: CoachSnapshot;
    reply: {
      goal: string;
      content: string;
      missingProfileFields: Array<keyof DemoState["profileFields"]>;
    };
  }>;
  submitMaterial: (draft: MaterialDraft) => Promise<{
    state: CoachSnapshot;
    latestPatch: DemoState["patches"][number] | null;
    weeklyBrief: DemoState["weeklyBrief"];
  }>;
};

let sharedDemoPersistenceAdapter: PersistenceAdapter | undefined;

export function createPersistenceAdapter(): PersistenceAdapter {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return createDrizzlePersistenceAdapter(databaseUrl);
  }

  return createMemoryPersistenceAdapter();
}

export function getSharedDemoPersistenceAdapter(): PersistenceAdapter {
  if (!sharedDemoPersistenceAdapter) {
    sharedDemoPersistenceAdapter = createPersistenceAdapter();
  }

  return sharedDemoPersistenceAdapter;
}

export function resetDemoPersistenceForTests() {
  sharedDemoPersistenceAdapter = undefined;
}

function createMemoryPersistenceAdapter(): PersistenceAdapter {
  let selectedPersonaSlug = DEFAULT_PERSONA_SLUG;
  let state = buildPersonaDemoState(selectedPersonaSlug);

  return {
    kind: "memory",
    canSwitchPersonas: true,
    async getCoachSnapshot() {
      return snapshotFromState(state, selectedPersonaSlug);
    },
    getSelectedPersonaSlug() {
      return selectedPersonaSlug;
    },
    async switchPersona(slug) {
      selectedPersonaSlug = slug;
      state = buildPersonaDemoState(slug);
      return snapshotFromState(state, selectedPersonaSlug);
    },
    async submitConversation(message) {
      const result = continueDemoConversation({ state, message });
      state = result.state;
      return {
        state: snapshotFromState(result.state, selectedPersonaSlug),
        reply: result.reply,
      };
    },
    async submitMaterial(draft) {
      const result = applyDemoMaterial({ state, draft });
      state = result.state;
      return {
        state: snapshotFromState(result.state, selectedPersonaSlug),
        latestPatch: result.latestPatch,
        weeklyBrief: result.weeklyBrief,
      };
    },
  };
}

function createDrizzlePersistenceAdapter(databaseUrl: string): PersistenceAdapter {
  const db = createDatabaseConnection(databaseUrl);

  return {
    kind: "drizzle",
    canSwitchPersonas: false,
    async getCoachSnapshot() {
      await ensureStarterData(db);
      const rows = await fetchCoreRows(db);
      return hydrateDemoStateFromPersistenceRows(rows);
    },
    getSelectedPersonaSlug() {
      return DEFAULT_PERSONA_SLUG;
    },
    async switchPersona(slug) {
      if (slug !== DEFAULT_PERSONA_SLUG) {
        throw new Error("Persona switching is only supported in memory demo mode.");
      }

      await ensureStarterData(db);
      const rows = await fetchCoreRows(db);
      return hydrateDemoStateFromPersistenceRows(rows);
    },
    async submitConversation(message) {
      await ensureStarterData(db);

      const currentRows = await fetchCoreRows(db);
      const currentSnapshot = hydrateDemoStateFromPersistenceRows(currentRows);
      const currentState = snapshotToDemoState(currentSnapshot);
      const result = continueDemoConversation({ state: currentState, message });
      const [latestCoachMessage, latestFamilyMessage] = result.state.conversation;

      if (latestFamilyMessage) {
        await insertConversation(db, latestFamilyMessage, "clarify_profile", "family");
      }

      if (latestCoachMessage) {
        await insertConversation(db, latestCoachMessage, "clarify_profile", "coach");
      }

      const persistedRows = await fetchCoreRows(db);
      const persistedState = hydrateDemoStateFromPersistenceRows(persistedRows);

      return {
        state: persistedState,
        reply: result.reply,
      };
    },
    async submitMaterial(draft) {
      await ensureStarterData(db);

      const currentRows = await fetchCoreRows(db);
      const currentSnapshot = hydrateDemoStateFromPersistenceRows(currentRows);
      const currentState = snapshotToDemoState(currentSnapshot);
      const nextResult = applyDemoMaterial({ state: currentState, draft });
      const latestConversation = nextResult.state.conversation[0];
      const previousConversation = currentState.conversation[0];

      const savedMaterial = await insertMaterial(db, draft);

      if (nextResult.latestPatch) {
        await insertPatch(db, {
          materialId: savedMaterial.id,
          patch: nextResult.latestPatch,
          state: nextResult.state,
        });
      }

      await insertWeeklyBrief(db, nextResult.state.weeklyBrief, "material_update");

      if (latestConversation && latestConversation !== previousConversation) {
        await insertConversation(db, latestConversation, "confirm_patch");
      }

      const persistedRows = await fetchCoreRows(db);
      const persistedState = hydrateDemoStateFromPersistenceRows(persistedRows);

      return {
        state: persistedState,
        latestPatch: persistedState.patches[0] ?? null,
        weeklyBrief: persistedState.weeklyBrief,
      };
    },
  };
}

export function buildDrizzleSeedPayload(): {
  household: HouseholdInsert;
  studentProfile: StudentProfileInsert;
  conversations: ConversationInsert[];
  weeklyBrief: WeeklyBriefInsert;
} {
  const defaultPersona = getDefaultPersona();
  const starterState = buildPersonaDemoState();
  const starterAt = new Date("2026-03-22T14:00:00.000Z");

  return {
    household: {
      id: DEMO_HOUSEHOLD_ID,
      primaryStudentId: DEMO_STUDENT_PROFILE_ID,
      primaryGuardianEmail: "demo-family@admitgenie.local",
      timezone: defaultPersona.household.timezone,
      goalsSummary: defaultPersona.household.goalsSummary,
      createdAt: starterAt,
      updatedAt: starterAt,
    },
    studentProfile: {
      id: DEMO_STUDENT_PROFILE_ID,
      householdId: DEMO_HOUSEHOLD_ID,
      firstName: defaultPersona.studentProfile.firstName,
      gradeLevel: defaultPersona.studentProfile.gradeLevel,
      graduationYear: defaultPersona.studentProfile.graduationYear,
      majorDirection: defaultPersona.studentProfile.majorDirection,
      testingSummary: starterState.profileFields.testingStatus.value,
      currentHookSummary: starterState.profileFields.currentFocus.value,
      profileConfidence: defaultPersona.studentProfile.profileConfidence,
      createdAt: starterAt,
      updatedAt: starterAt,
    },
    conversations: starterState.conversation.map((content, index) => ({
      householdId: DEMO_HOUSEHOLD_ID,
      studentProfileId: DEMO_STUDENT_PROFILE_ID,
      role: "coach",
      content,
      conversationGoal: index === 0 ? "collect_context" : "clarify_profile",
      createdAt: new Date(starterAt.getTime() - index * 60_000),
    })),
    weeklyBrief: {
      studentProfileId: DEMO_STUDENT_PROFILE_ID,
      weekStartDate: "2026-03-16",
      whatChanged: starterState.weeklyBrief.whatChanged,
      whatMatters: starterState.weeklyBrief.whatMatters,
      topActionsJson: starterState.weeklyBrief.topActions,
      risksJson: starterState.weeklyBrief.risks,
      whyThisAdvice: starterState.weeklyBrief.whyThisAdvice,
      generationReason: "starter_profile",
      createdAt: starterAt,
    },
  };
}

export async function getDemoStateResponseFromPersistence() {
  const adapter = getSharedDemoPersistenceAdapter();

  return {
    state: await adapter.getCoachSnapshot(),
    capabilities: getDemoCapabilities(),
    demoPersona: getDemoPersonaConfig(adapter),
    deployment: getDemoDeploymentStatus(adapter),
  };
}

export function getDemoDeploymentStatus(
  adapter: PersistenceAdapter = createPersistenceAdapter(),
): DemoDeploymentStatus {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const isDurable = adapter.kind === "drizzle";

  return {
    persistenceKind: adapter.kind,
    hasDatabaseUrl,
    isDurable,
    readyForSharedDemo: isDurable,
    blocker: isDurable
      ? null
      : "Stable shared demo deployment requires DATABASE_URL so the app can persist state outside memory mode.",
  };
}

export async function switchDemoPersonaFromPersistence(slug: string) {
  if (!isPersonaSlug(slug)) {
    throw new Error("Invalid persona slug.");
  }

  const adapter = getSharedDemoPersistenceAdapter();

  return {
    state: await adapter.switchPersona(slug),
    demoPersona: getDemoPersonaConfig(adapter, slug),
  };
}

export function hydrateDemoStateFromPersistenceRows(
  rows: PersistedCoreRows,
): CoachSnapshot {
  const starterState = buildPersonaDemoState();
  const sortedConversations = sortByCreatedAtDesc(rows.conversations);
  const sortedMaterials = sortByCreatedAtDesc(rows.materialItems, "submittedAt");
  const sortedPatches = sortByCreatedAtDesc(rows.profilePatches);
  const sortedBriefs = sortByCreatedAtDesc(rows.weeklyBriefs);
  const latestTestingStatus = findLatestTestingStatus(sortedPatches);
  const latestBrief = sortedBriefs[0];
  const entitySummary = resolveEntitySummary(rows);

  return {
    household: entitySummary.household,
    studentProfile: entitySummary.studentProfile,
    conversation:
      sortedConversations.length > 0
        ? sortedConversations.map((item) => item.content)
        : starterState.conversation,
    materials:
      sortedMaterials.length > 0
        ? sortedMaterials.map((item) => ({
            id: item.id,
            type: toMaterialType(item.materialType),
            title: item.userLabel ?? prettifyMaterialType(item.materialType),
            content: item.rawText ?? "",
            submittedAt: item.submittedAt.toISOString(),
          }))
        : starterState.materials,
    patches:
      sortedPatches.length > 0
        ? sortedPatches.map((item) => ({
            id: item.id,
            summary: item.patchSummary,
            impact: item.impactSummary,
            status: "applied",
          }))
        : starterState.patches,
    profileFields: {
      ...starterState.profileFields,
      testingStatus: latestTestingStatus
        ? {
            label: "Testing",
            value: latestTestingStatus,
            status: "known",
          }
        : starterState.profileFields.testingStatus,
      currentFocus:
        sortedMaterials.length > 0
          ? {
              label: "Current focus",
              value: "Use recent materials to sharpen the next coaching brief",
              status: "inferred",
            }
          : starterState.profileFields.currentFocus,
    },
    weeklyBrief: latestBrief
      ? {
          whatChanged: latestBrief.whatChanged,
          whatMatters: latestBrief.whatMatters,
          topActions: toStringArray(latestBrief.topActionsJson),
          risks: toStringArray(latestBrief.risksJson),
          whyThisAdvice: latestBrief.whyThisAdvice,
        }
      : starterState.weeklyBrief,
  };
}

async function ensureStarterData(db: AdmitGenieDatabase): Promise<void> {
  const [existingHousehold] = await db
    .select({ id: households.id })
    .from(households)
    .limit(1);
  const [existingStudentProfile] = await db
    .select({ id: studentProfiles.id })
    .from(studentProfiles)
    .limit(1);
  const [existingConversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .limit(1);
  const [existingBrief] = await db
    .select({ id: weeklyBriefs.id })
    .from(weeklyBriefs)
    .limit(1);

  const seed = buildDrizzleSeedPayload();

  if (!existingHousehold) {
    await db.insert(households).values(seed.household);
  }

  if (!existingStudentProfile) {
    await db.insert(studentProfiles).values(seed.studentProfile);
  }

  if (!existingConversation) {
    await db.insert(conversations).values(seed.conversations);
  }

  if (!existingBrief) {
    await db.insert(weeklyBriefs).values(seed.weeklyBrief);
  }
}

async function fetchCoreRows(db: AdmitGenieDatabase): Promise<PersistedCoreRows> {
  const [householdRows, studentProfileRows, conversationRows, materialRows, patchRows, briefRows] =
    await Promise.all([
      db.select().from(households).orderBy(desc(households.updatedAt)),
      db.select().from(studentProfiles).orderBy(desc(studentProfiles.updatedAt)),
    db.select().from(conversations).orderBy(desc(conversations.createdAt)),
    db.select().from(materialItems).orderBy(desc(materialItems.submittedAt)),
    db.select().from(profilePatches).orderBy(desc(profilePatches.createdAt)),
    db.select().from(weeklyBriefs).orderBy(desc(weeklyBriefs.createdAt)),
    ]);

  return {
    households: householdRows,
    studentProfiles: studentProfileRows,
    conversations: conversationRows,
    materialItems: materialRows,
    profilePatches: patchRows,
    weeklyBriefs: briefRows,
  };
}

async function insertMaterial(
  db: AdmitGenieDatabase,
  draft: MaterialDraft,
): Promise<MaterialRow> {
  const entities = await resolveDemoEntities(db);
  const [inserted] = await db
    .insert(materialItems)
    .values({
      householdId: entities.household.id,
      studentProfileId: entities.studentProfile.id,
      materialType: draft.type,
      sourceChannel: DEMO_SOURCE_CHANNEL,
      rawText: draft.content,
      userLabel: draft.title,
      ingestionStatus: "applied",
    })
    .returning();

  return inserted;
}

async function insertPatch(
  db: AdmitGenieDatabase,
  input: {
    materialId: string;
    patch: DemoState["patches"][number];
    state: DemoState;
  },
): Promise<ProfilePatchRow> {
  const entities = await resolveDemoEntities(db);
  const [inserted] = await db
    .insert(profilePatches)
    .values({
      studentProfileId: entities.studentProfile.id,
      triggerSourceType: "material",
      triggerSourceId: input.materialId,
      patchSummary: input.patch.summary,
      patchPayloadJson: {
        testingStatus: input.state.profileFields.testingStatus.value,
      },
      status: input.patch.status,
      impactSummary: input.patch.impact,
    })
    .returning();

  return inserted;
}

async function insertWeeklyBrief(
  db: AdmitGenieDatabase,
  brief: DemoState["weeklyBrief"],
  generationReason: string,
): Promise<WeeklyBriefRow> {
  const entities = await resolveDemoEntities(db);
  const [inserted] = await db
    .insert(weeklyBriefs)
    .values({
      studentProfileId: entities.studentProfile.id,
      weekStartDate: "2026-03-16",
      whatChanged: brief.whatChanged,
      whatMatters: brief.whatMatters,
      topActionsJson: brief.topActions,
      risksJson: brief.risks,
      whyThisAdvice: brief.whyThisAdvice,
      generationReason,
    })
    .returning();

  return inserted;
}

async function insertConversation(
  db: AdmitGenieDatabase,
  content: string,
  goal: string,
  role: string = "coach",
): Promise<ConversationRow> {
  const entities = await resolveDemoEntities(db);
  const [inserted] = await db
    .insert(conversations)
    .values({
      householdId: entities.household.id,
      studentProfileId: entities.studentProfile.id,
      role,
      content,
      conversationGoal: goal,
    })
    .returning();

  return inserted;
}

async function resolveDemoEntities(db: AdmitGenieDatabase): Promise<{
  household: HouseholdRow;
  studentProfile: StudentProfileRow;
}> {
  const [household, studentProfile] = await Promise.all([
    db
      .select()
      .from(households)
      .where(eq(households.id, DEMO_HOUSEHOLD_ID))
      .limit(1),
    db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.id, DEMO_STUDENT_PROFILE_ID))
      .limit(1),
  ]);

  const resolvedHousehold = household[0];
  const resolvedStudentProfile = studentProfile[0];

  if (!resolvedHousehold || !resolvedStudentProfile) {
    throw new Error("Demo household/student profile records must exist before persistence writes.");
  }

  return {
    household: resolvedHousehold,
    studentProfile: resolvedStudentProfile,
  };
}

function snapshotFromState(
  state: DemoState,
  personaSlug: string = DEFAULT_PERSONA_SLUG,
): CoachSnapshot {
  const persona = getPersonaBySlug(personaSlug);

  return {
    household: {
      id: DEMO_HOUSEHOLD_ID,
      timezone: persona.household.timezone,
      goalsSummary: persona.household.goalsSummary,
    },
    studentProfile: {
      id: DEMO_STUDENT_PROFILE_ID,
      firstName: persona.studentProfile.firstName,
      gradeLevel: persona.studentProfile.gradeLevel,
      graduationYear: persona.studentProfile.graduationYear,
      majorDirection: persona.studentProfile.majorDirection,
    },
    conversation: state.conversation,
    materials: state.materials,
    patches: state.patches,
    weeklyBrief: state.weeklyBrief,
    profileFields: state.profileFields,
  };
}

function snapshotToDemoState(snapshot: CoachSnapshot): DemoState {
  return {
    conversation: snapshot.conversation,
    materials: snapshot.materials,
    patches: snapshot.patches,
    profileFields: snapshot.profileFields,
    weeklyBrief: snapshot.weeklyBrief,
  };
}

function sortByCreatedAtDesc<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T = "createdAt" as keyof T,
): T[] {
  return [...rows].sort(
    (left, right) => readDateValue(right[key]) - readDateValue(left[key]),
  );
}

function readDateValue(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).getTime();
  }

  return 0;
}

function findLatestTestingStatus(
  patches: ProfilePatchRow[],
): string | undefined {
  for (const patch of patches) {
    const payload = patch.patchPayloadJson;

    if (
      payload &&
      typeof payload === "object" &&
      "testingStatus" in payload &&
      typeof payload.testingStatus === "string"
    ) {
      return payload.testingStatus;
    }
  }

  return undefined;
}

function toMaterialType(value: string): MaterialType {
  if (
    value === "transcript" ||
    value === "test_score" ||
    value === "activity_update" ||
    value === "award" ||
    value === "school_list" ||
    value === "essay_note" ||
    value === "freeform_note"
  ) {
    return value;
  }

  return "freeform_note";
}

function prettifyMaterialType(value: string): string {
  return value.replaceAll("_", " ");
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function resolveEntitySummary(rows: PersistedCoreRows): {
  household: CoachHousehold;
  studentProfile: CoachStudentProfile;
} {
  const household = rows.households?.[0];
  const studentProfile = rows.studentProfiles?.[0];

  return {
    household: household
      ? {
          id: household.id,
          timezone: household.timezone,
          goalsSummary: household.goalsSummary ?? null,
        }
      : defaultCoachHousehold(),
    studentProfile: studentProfile
      ? {
          id: studentProfile.id,
          firstName: studentProfile.firstName ?? null,
          gradeLevel: studentProfile.gradeLevel,
          graduationYear: studentProfile.graduationYear ?? null,
          majorDirection: studentProfile.majorDirection ?? null,
        }
      : defaultCoachStudentProfile(),
  };
}

function defaultCoachHousehold(): CoachHousehold {
  const seed = buildDrizzleSeedPayload();

  return {
    id: seed.household.id,
    timezone: seed.household.timezone,
    goalsSummary: seed.household.goalsSummary ?? null,
  };
}

function defaultCoachStudentProfile(): CoachStudentProfile {
  const seed = buildDrizzleSeedPayload();

  return {
    id: seed.studentProfile.id,
    firstName: seed.studentProfile.firstName ?? null,
    gradeLevel: seed.studentProfile.gradeLevel,
    graduationYear: seed.studentProfile.graduationYear ?? null,
    majorDirection: seed.studentProfile.majorDirection ?? null,
  };
}

function getDemoPersonaConfig(
  adapter: PersistenceAdapter,
  selectedSlug: string = adapter.getSelectedPersonaSlug(),
): DemoPersonaConfig {
  return {
    canSwitch: adapter.canSwitchPersonas,
    selectedSlug,
    options: listPersonaOptions(),
  };
}
