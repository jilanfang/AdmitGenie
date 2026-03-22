# Data Models

## Overview

AdmitGenie MVP is AI-native at the interface layer, but internally it remains schema-driven.

The core design rule is:

> Every important recommendation should be grounded in structured profile state plus traceable evidence.

## Core Entities

## Household

Represents the family-level container.

Suggested fields:

- `id`
- `primary_student_id`
- `primary_guardian_email`
- `timezone`
- `goals_summary`
- `created_at`
- `updated_at`

## StudentProfile

The main structured student state.

Suggested fields:

- `id`
- `household_id`
- `first_name`
- `grade_level`
- `graduation_year`
- `major_direction`
- `testing_summary`
- `current_hook_summary`
- `profile_confidence`
- `created_at`
- `updated_at`

## ProfileField

Represents one field plus metadata.

Suggested fields:

- `id`
- `student_profile_id`
- `field_key`
- `field_value_json`
- `status`
- `source_priority`
- `last_confirmed_at`
- `last_updated_at`

## ProfileFieldStatus

Enum:

- `known`
- `inferred`
- `unconfirmed`
- `stale`
- `conflicting`

## MaterialItem

Represents a submitted piece of material.

Suggested fields:

- `id`
- `household_id`
- `student_profile_id`
- `material_type`
- `source_channel`
- `blob_url`
- `raw_text`
- `user_label`
- `ingestion_status`
- `submitted_at`

## MaterialType

Enum candidates:

- `transcript`
- `test_score`
- `activity_update`
- `award`
- `school_list`
- `essay_note`
- `freeform_note`
- `other`

## ExtractedFact

Represents one structured fact inferred from a conversation or material.

Suggested fields:

- `id`
- `student_profile_id`
- `source_type`
- `source_id`
- `fact_key`
- `fact_value_json`
- `confidence`
- `needs_confirmation`
- `created_at`

## ProfilePatch

Represents a proposed profile update.

Suggested fields:

- `id`
- `student_profile_id`
- `trigger_source_type`
- `trigger_source_id`
- `patch_summary`
- `patch_payload_json`
- `status`
- `impact_summary`
- `created_at`
- `resolved_at`

Patch status candidates:

- `proposed`
- `applied`
- `rejected`
- `needs_confirmation`
- `conflict`

## EvidenceLink

Connects fields or patches back to source evidence.

Suggested fields:

- `id`
- `entity_type`
- `entity_id`
- `source_type`
- `source_id`
- `excerpt`
- `created_at`

## ConversationTurn

Represents a single exchange in the coach conversation.

Suggested fields:

- `id`
- `household_id`
- `student_profile_id`
- `role`
- `content`
- `conversation_goal`
- `created_at`

## ConversationGoal

Enum candidates:

- `collect_context`
- `clarify_profile`
- `confirm_patch`
- `deliver_brief`
- `follow_up_action`
- `resolve_conflict`

## WeeklyBrief

Represents one generated brief.

Suggested fields:

- `id`
- `student_profile_id`
- `week_start_date`
- `what_changed`
- `what_matters`
- `top_actions_json`
- `risks_json`
- `why_this_advice`
- `generation_reason`
- `created_at`

## InboxItem

Represents any surfaced item in the coach inbox.

Suggested fields:

- `id`
- `student_profile_id`
- `item_type`
- `title`
- `body`
- `priority`
- `related_entity_type`
- `related_entity_id`
- `status`
- `created_at`

Item type candidates:

- `brief`
- `follow_up`
- `patch_summary`
- `alert`
- `action`

## ActionItem

Represents a recommended or tracked user action.

Suggested fields:

- `id`
- `student_profile_id`
- `weekly_brief_id`
- `title`
- `description`
- `priority`
- `due_date`
- `status`
- `created_at`

## Modeling Rules

### Rule 1

Conversation alone is not source of truth.

Conversation creates candidate facts that become structured state.

### Rule 2

Materials are durable.

Even if parsing fails, the raw material item still exists and can be retried later.

### Rule 3

Every critical field should be traceable.

Fields and patches should be explainable through evidence links.

### Rule 4

Conflicts are first-class.

The model must preserve conflicting states instead of pretending they do not exist.
