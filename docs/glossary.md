# AdmitGenie Glossary

## Product Terms

**Coach Inbox**  
The main user surface. It combines conversation, material intake, updates, and monthly guidance in a single persistent view.

**Monthly Brief**  
A structured monthly output that tells the user what changed, what matters now, the top actions, key risks, and why the system is recommending them.

**Guided Interview**  
The AI-native onboarding flow. The system asks a small number of high-leverage questions and progressively builds the user profile.

**Material Inbox**  
The place where users can add new information at any time: transcripts, scores, activities, awards, school lists, essay notes, and freeform updates.

**Profile**  
The system's structured understanding of the student and household. It is internally schema-driven even though the user does not fill out a large form.

**Hook**  
A working synthesis of the student's distinctive story, interests, strengths, and potential admissions narrative.

**School Watch**  
The subset of schools the system tracks for relevant changes, deadlines, and application context.

**Action Item**  
A specific, user-visible next step derived from the current profile, school watch context, and timeline.

## Data Terms

**MaterialItem**  
A user-submitted or system-ingested piece of input, such as a transcript PDF, SAT score note, activity update, or school list.

**ExtractedFact**  
A structured fact produced from a conversation turn or material item.

**ProfileField**  
A single structured field in the profile, such as GPA, graduation year, intended major direction, or SAT math score.

**ProfilePatch**  
A proposed change to the profile based on new evidence. Patches are reviewed, summarized, and then applied instead of silently mutating profile state.

**EvidenceLink**  
A trace from a profile field or patch back to the original source conversation turn or material item.

**ChangeEvent**  
A school, timeline, or profile-related change that can affect recommendations and ongoing guidance.

## Status Terms

**known**  
Explicitly confirmed by the user or trusted material.

**inferred**  
Derived by the system with reasonable confidence, but not yet confirmed.

**unconfirmed**  
Captured but still awaiting user confirmation.

**stale**  
Previously known, but likely outdated based on time or conflicting inputs.

**conflicting**  
Two or more sources disagree, and the system cannot safely resolve the difference on its own.

## AI Terms

**Interview Coach**  
The AI role responsible for collecting minimal necessary information through natural dialogue.

**Profile Synthesizer**  
The AI/system role that converts conversations and materials into structured profile state.

**Material Parser**  
The ingestion component that classifies, extracts, and summarizes uploaded or pasted materials.

**Brief Composer**  
The component that turns current profile state, changes, and priorities into the Monthly Brief.

**Update Notifier**  
The component that decides whether new information should trigger an immediate alert, a new prompt, or wait for the next brief.
