CREATE TABLE "households" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"primary_student_id" varchar(64) NOT NULL,
	"primary_guardian_email" varchar(255),
	"timezone" varchar(64) NOT NULL,
	"goals_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"household_id" varchar(64) NOT NULL,
	"first_name" varchar(128),
	"grade_level" varchar(64) NOT NULL,
	"graduation_year" varchar(16),
	"major_direction" text,
	"testing_summary" text,
	"current_hook_summary" text,
	"profile_confidence" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
