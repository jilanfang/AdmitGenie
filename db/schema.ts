import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const households = pgTable("households", {
  id: varchar("id", { length: 64 }).primaryKey(),
  primaryStudentId: varchar("primary_student_id", { length: 64 }).notNull(),
  primaryGuardianEmail: varchar("primary_guardian_email", { length: 255 }),
  timezone: varchar("timezone", { length: 64 }).notNull(),
  goalsSummary: text("goals_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  householdId: varchar("household_id", { length: 64 }).notNull(),
  firstName: varchar("first_name", { length: 128 }),
  gradeLevel: varchar("grade_level", { length: 64 }).notNull(),
  graduationYear: varchar("graduation_year", { length: 16 }),
  majorDirection: text("major_direction"),
  testingSummary: text("testing_summary"),
  currentHookSummary: text("current_hook_summary"),
  profileConfidence: varchar("profile_confidence", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversations = pgTable("conversation_turns", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: varchar("household_id", { length: 64 }).notNull(),
  studentProfileId: varchar("student_profile_id", { length: 64 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  content: text("content").notNull(),
  conversationGoal: varchar("conversation_goal", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const materialItems = pgTable("material_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: varchar("household_id", { length: 64 }).notNull(),
  studentProfileId: varchar("student_profile_id", { length: 64 }).notNull(),
  materialType: varchar("material_type", { length: 64 }).notNull(),
  sourceChannel: varchar("source_channel", { length: 64 }).notNull(),
  blobUrl: text("blob_url"),
  rawText: text("raw_text"),
  userLabel: text("user_label"),
  ingestionStatus: varchar("ingestion_status", { length: 32 }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profilePatches = pgTable("profile_patches", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: varchar("student_profile_id", { length: 64 }).notNull(),
  triggerSourceType: varchar("trigger_source_type", { length: 32 }).notNull(),
  triggerSourceId: varchar("trigger_source_id", { length: 64 }).notNull(),
  patchSummary: text("patch_summary").notNull(),
  patchPayloadJson: jsonb("patch_payload_json").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  impactSummary: text("impact_summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const weeklyBriefs = pgTable("weekly_briefs", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: varchar("student_profile_id", { length: 64 }).notNull(),
  weekStartDate: varchar("week_start_date", { length: 32 }).notNull(),
  whatChanged: text("what_changed").notNull(),
  whatMatters: text("what_matters").notNull(),
  topActionsJson: jsonb("top_actions_json").notNull(),
  risksJson: jsonb("risks_json").notNull(),
  whyThisAdvice: text("why_this_advice").notNull(),
  generationReason: text("generation_reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
