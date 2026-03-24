import {
  createInitialDemoState,
  submitMaterialDraft,
} from "@/lib/domain/demo-state";
import { continueDemoConversation } from "@/lib/domain/demo-contracts";

describe("demo-state", () => {
  it("starts with a coach-led brief and missing information markers", () => {
    const state = createInitialDemoState();

    expect(state.conversation[0]).toMatch(/Welcome back/i);
    expect(state.conversation[1]).toMatch(/Guided interview/i);
    expect(state.weeklyBrief.whatMatters).toContain("school list");
    expect(state.profileFields.testingStatus.status).toBe("unconfirmed");
    expect(state.profileFields.schoolList.status).toBe("unconfirmed");
  });

  it("updates profile state and brief when a new SAT material is added", () => {
    const state = createInitialDemoState();

    const updated = submitMaterialDraft(state, {
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });

    expect(updated.materials).toHaveLength(1);
    expect(updated.patches[0]?.summary).toContain("SAT Math 760");
    expect(updated.profileFields.testingStatus.status).toBe("known");
    expect(updated.weeklyBrief.whatChanged).toContain("SAT");
    expect(updated.weeklyBrief.whyThisAdvice).toContain("academic positioning");
    expect(updated.conversation.at(-1)).toMatch(/I found a new SAT update/i);
    expect(updated.materialAnalysis[0]?.patchStatus).toBe("applied");
    expect(updated.materialAnalysis[0]?.affectedFields).toContain("testingStatus");
    expect(updated.pendingPatch).toBeNull();
  });

  it("marks an ambiguous school list as needs confirmation", () => {
    const state = createInitialDemoState();

    const updated = submitMaterialDraft(state, {
      type: "school_list",
      title: "Maybe schools",
      content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    });

    expect(updated.materialAnalysis[0]?.patchStatus).toBe("needs_confirmation");
    expect(updated.materialAnalysis[0]?.affectedFields).toContain("schoolList");
    expect(updated.pendingPatch?.status).toBe("needs_confirmation");
    expect(updated.profileFields.schoolList.status).toBe("unconfirmed");
  });

  it("marks conflicting testing updates without silently overwriting known testing state", () => {
    const state = submitMaterialDraft(createInitialDemoState(), {
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });

    const updated = submitMaterialDraft(state, {
      type: "test_score",
      title: "Conflicting SAT",
      content: "Updated SAT update: Math 700, Reading and Writing 680.",
    });

    expect(updated.materialAnalysis[0]?.patchStatus).toBe("conflict");
    expect(updated.pendingPatch?.status).toBe("conflict");
    expect(updated.profileFields.testingStatus.value).toContain("760");
    expect(updated.profileFields.testingStatus.status).toBe("known");
  });

  it("appends new family and coach turns after the opening transcript", () => {
    const state = createInitialDemoState();

    const updated = continueDemoConversation({
      state,
      message: "We want selective engineering programs but do not have a school list yet.",
    });

    expect(updated.state.conversation[0]).toMatch(/Welcome back/i);
    expect(updated.state.conversation[1]).toMatch(/Guided interview/i);
    expect(updated.state.conversation.at(-2)).toMatch(/^Family:/);
    expect(updated.state.conversation.at(-1)).toMatch(/^Coach:/);
  });

  it("turns a first-run starter message into early onboarding guidance", () => {
    const state = createInitialDemoState();

    const updated = continueDemoConversation({
      state,
      message:
        "I'm in 11th grade and aiming for selective engineering programs, but we do not have a school list yet and testing is still unclear. I'm worried we may be aiming too high.",
    });

    expect(updated.reply.goal).toBe("deliver_brief");
    expect(updated.reply.nextPromptType).toBe("deliver_initial_guidance");
    expect(updated.reply.content).toMatch(/current understanding/i);
    expect(updated.reply.content).toMatch(/top priority/i);
    expect(updated.reply.content).toMatch(/sharpen the advice/i);
    expect(updated.reply.content).toMatch(/SAT|ACT|school list/i);
    expect(updated.state.profileFields.currentFocus.value).toMatch(/testing|school list|priority/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/starter understanding|clearer starting point/i);
    expect(updated.state.weeklyBrief.whatMatters).toMatch(/testing|school list/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/SAT|ACT|school list/i);
    expect(updated.state.conversation.at(-1)).toMatch(/current understanding/i);
  });

  it("prioritizes patch confirmation over generic profile clarification when a pending patch exists", () => {
    const state = submitMaterialDraft(createInitialDemoState(), {
      type: "school_list",
      title: "Maybe schools",
      content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    });

    const updated = continueDemoConversation({
      state,
      message: "What should I do next?",
    });

    expect(updated.reply.goal).toBe("confirm_patch");
    expect(updated.reply.content).toMatch(/confirm|shortlist|school list/i);
  });

  it("asks about execution progress after a brief-driving material update", () => {
    const state = submitMaterialDraft(createInitialDemoState(), {
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });

    const updated = continueDemoConversation({
      state,
      message: "Thanks, what now?",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.content).toMatch(/school list|reach|target|next step/i);
  });

  it("confirms an ambiguous school list through conversation and applies it to the profile", () => {
    const state = submitMaterialDraft(createInitialDemoState(), {
      type: "school_list",
      title: "Maybe schools",
      content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
    });

    const updated = continueDemoConversation({
      state,
      message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
    });

    expect(updated.reply.goal).toBe("confirm_patch");
    expect(updated.state.pendingPatch).toBeNull();
    expect(updated.state.profileFields.schoolList.status).toBe("known");
    expect(updated.state.profileFields.schoolList.value).toContain("Purdue");
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/school list/i);
    expect(updated.state.conversation.at(-1)).toMatch(/confirmed|school list|next step/i);
  });

  it("resolves a testing conflict through conversation and keeps the confirmed score", () => {
    const withKnownScore = submitMaterialDraft(createInitialDemoState(), {
      type: "test_score",
      title: "March SAT",
      content: "New SAT update: Math 760, Reading and Writing 730.",
    });
    const conflicted = submitMaterialDraft(withKnownScore, {
      type: "test_score",
      title: "Conflicting SAT",
      content: "Updated SAT update: Math 700, Reading and Writing 680.",
    });

    const updated = continueDemoConversation({
      state: conflicted,
      message: "Use the newer 700 and 680 score.",
    });

    expect(updated.reply.goal).toBe("resolve_conflict");
    expect(updated.state.pendingPatch).toBeNull();
    expect(updated.state.profileFields.testingStatus.status).toBe("known");
    expect(updated.state.profileFields.testingStatus.value).toContain("700");
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/testing|SAT/i);
    expect(updated.state.conversation.at(-1)).toMatch(/resolved|testing|school list/i);
  });

  it("turns a confirmed school list into bucketed execution guidance through chat", () => {
    const withConfirmedSchoolList = continueDemoConversation({
      state: submitMaterialDraft(createInitialDemoState(), {
        type: "school_list",
        title: "Maybe schools",
        content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
      }),
      message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
    }).state;

    const updated = continueDemoConversation({
      state: withConfirmedSchoolList,
      message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.content).toMatch(/bucket|reach|target|safer-fit|execution/i);
    expect(updated.state.profileFields.schoolList.status).toBe("known");
    expect(updated.state.profileFields.schoolList.value).toMatch(/Reach:/i);
    expect(updated.state.profileFields.schoolList.value).toMatch(/Target:/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/school list|bucket/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/safer-fit|essay|deadlines|compare/i);
  });

  it("turns bucketed schools into a deadline-aware execution loop through chat", () => {
    const withBucketedSchoolList = continueDemoConversation({
      state: continueDemoConversation({
        state: submitMaterialDraft(createInitialDemoState(), {
          type: "school_list",
          title: "Maybe schools",
          content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
        }),
        message:
          "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
      }).state,
      message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
    }).state;

    const updated = continueDemoConversation({
      state: withBucketedSchoolList,
      message:
        "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.content).toMatch(/timing|deadline|early|regular/i);
    expect(updated.state.profileFields.applicationTiming.status).toBe("known");
    expect(updated.state.profileFields.applicationTiming.value).toMatch(/Early:/i);
    expect(updated.state.profileFields.applicationTiming.value).toMatch(/Regular:/i);
    expect(updated.state.profileFields.applicationTiming.value).toMatch(/binding/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/deadline|timing|early|regular/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/early|deadline|regular/i);
  });

  it("turns timing strategy into story and material priorities through chat", () => {
    const withTiming = continueDemoConversation({
      state: continueDemoConversation({
        state: continueDemoConversation({
          state: submitMaterialDraft(createInitialDemoState(), {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          }),
          message:
            "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }).state,
        message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
      }).state,
      message:
        "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
    }).state;

    const updated = continueDemoConversation({
      state: withTiming,
      message:
        "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.nextPromptType).toBe("advance_story_priority");
    expect(updated.reply.content).toMatch(/material|story|priority|early/i);
    expect(updated.state.profileFields.currentFocus.value).toMatch(/story|material|priority/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/story|material|priority/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/leadership|STEM|early|material/i);
  });

  it("turns story priorities into an execution-progress loop through chat", () => {
    const withStoryPriority = continueDemoConversation({
      state: continueDemoConversation({
        state: continueDemoConversation({
          state: continueDemoConversation({
            state: submitMaterialDraft(createInitialDemoState(), {
              type: "school_list",
              title: "Maybe schools",
              content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
            }),
            message:
              "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
          }).state,
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }).state,
        message:
          "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
      }).state,
      message:
        "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
    }).state;

    const updated = continueDemoConversation({
      state: withStoryPriority,
      message:
        "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.nextPromptType).toBe("track_execution_progress");
    expect(updated.reply.content).toMatch(/draft|evidence|execution|next/i);
    expect(updated.state.profileFields.currentFocus.value).toMatch(/Purdue|Georgia Tech|draft|evidence/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/draft|evidence|progress|execution/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/finish|evidence|early/i);
  });

  it("turns execution progress into blocker-resolution guidance through chat", () => {
    const withExecutionProgress = continueDemoConversation({
      state: continueDemoConversation({
        state: continueDemoConversation({
          state: continueDemoConversation({
            state: continueDemoConversation({
              state: submitMaterialDraft(createInitialDemoState(), {
                type: "school_list",
                title: "Maybe schools",
                content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
              }),
              message:
                "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
            }).state,
            message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
          }).state,
          message:
            "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        }).state,
        message:
          "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
      }).state,
      message:
        "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
    }).state;

    const updated = continueDemoConversation({
      state: withExecutionProgress,
      message:
        "We are blocked because Purdue still needs a stronger leadership example and Georgia Tech needs clearer robotics proof.",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.nextPromptType).toBe("resolve_execution_blocker");
    expect(updated.reply.content).toMatch(/blocked|leadership|robotics|proof|next/i);
    expect(updated.state.profileFields.currentFocus.value).toMatch(/blocker|leadership|robotics|proof/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/blocker|leadership|robotics|proof/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/leadership|robotics|proof|evidence/i);
  });

  it("turns resolved blockers into a ready-to-ship action list through chat", () => {
    const withBlocker = continueDemoConversation({
      state: continueDemoConversation({
        state: continueDemoConversation({
          state: continueDemoConversation({
            state: continueDemoConversation({
              state: continueDemoConversation({
                state: submitMaterialDraft(createInitialDemoState(), {
                  type: "school_list",
                  title: "Maybe schools",
                  content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
                }),
                message:
                  "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
              }).state,
              message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
            }).state,
            message:
              "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
          }).state,
          message:
            "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        }).state,
        message:
          "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
      }).state,
      message:
        "We are blocked because Purdue still needs a stronger leadership example and Georgia Tech needs clearer robotics proof.",
    }).state;

    const updated = continueDemoConversation({
      state: withBlocker,
      message:
        "We now have the Purdue leadership example and clearer robotics proof for Georgia Tech, so those blockers are resolved.",
    });

    expect(updated.reply.goal).toBe("follow_up_action");
    expect(updated.reply.nextPromptType).toBe("ship_ready_actions");
    expect(updated.reply.content).toMatch(/ready|ship|polish|submit|final/i);
    expect(updated.state.profileFields.currentFocus.value).toMatch(/ready|ship|final|polish/i);
    expect(updated.state.weeklyBrief.whatChanged).toMatch(/resolved|ready|final/i);
    expect(updated.state.weeklyBrief.topActions.join(" ")).toMatch(/final|polish|submit|review/i);
  });
});
