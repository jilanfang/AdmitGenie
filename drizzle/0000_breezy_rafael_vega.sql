CREATE TABLE "conversation_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar(64) NOT NULL,
	"student_profile_id" varchar(64) NOT NULL,
	"role" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"conversation_goal" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar(64) NOT NULL,
	"student_profile_id" varchar(64) NOT NULL,
	"material_type" varchar(64) NOT NULL,
	"source_channel" varchar(64) NOT NULL,
	"blob_url" text,
	"raw_text" text,
	"user_label" text,
	"ingestion_status" varchar(32) NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_patches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_profile_id" varchar(64) NOT NULL,
	"trigger_source_type" varchar(32) NOT NULL,
	"trigger_source_id" varchar(64) NOT NULL,
	"patch_summary" text NOT NULL,
	"patch_payload_json" jsonb NOT NULL,
	"status" varchar(32) NOT NULL,
	"impact_summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "weekly_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_profile_id" varchar(64) NOT NULL,
	"week_start_date" varchar(32) NOT NULL,
	"what_changed" text NOT NULL,
	"what_matters" text NOT NULL,
	"top_actions_json" jsonb NOT NULL,
	"risks_json" jsonb NOT NULL,
	"why_this_advice" text NOT NULL,
	"generation_reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
