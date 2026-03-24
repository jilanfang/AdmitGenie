import { GET as getState } from "@/app/api/demo/state/route";
import { GET as getReadiness } from "@/app/api/demo/readiness/route";
import { POST as postConversation } from "@/app/api/demo/conversation/route";
import { POST as postMaterial } from "@/app/api/demo/materials/route";
import { POST as postPersona } from "@/app/api/demo/persona/route";
import { resetDemoPersistenceForTests } from "@/lib/server/persistence";

describe("demo api routes", () => {
  beforeEach(() => {
    resetDemoPersistenceForTests();
  });

  it("returns the initial demo state and capabilities", async () => {
    const response = await getState(new Request("http://localhost/api/demo/state"));
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        state: {
          household: {
            timezone: string;
          };
          studentProfile: {
            firstName: string;
            gradeLevel: string;
          };
          profileFields: {
            testingStatus: {
              status: string;
            };
          };
        };
        capabilities: {
          materialTypes: string[];
          conversationGoals: string[];
        };
        deployment: {
          persistenceKind: string;
          readyForSharedDemo: boolean;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.state.household.timezone).toBe("America/Los_Angeles");
    expect(json.data.state.studentProfile.firstName).toBe("Demo Student");
    expect(json.data.state.studentProfile.gradeLevel).toBe("11th grade");
    expect(json.data.state.profileFields.testingStatus.status).toBe("unconfirmed");
    expect(json.data.capabilities.materialTypes).toContain("test_score");
    expect(json.data.capabilities.conversationGoals).toContain("clarify_profile");
    expect(json.data.deployment.persistenceKind).toBe("memory");
    expect(json.data.deployment.readyForSharedDemo).toBe(false);
  });

  it("isolates memory-mode state by workspace query parameter", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials?workspace=alpha", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "Alpha SAT",
            content: "New SAT update: Math 760, Reading and Writing 730.",
          },
        }),
      }),
    );

    const alphaState = await getState(
      new Request("http://localhost/api/demo/state?workspace=alpha"),
    );
    const betaState = await getState(
      new Request("http://localhost/api/demo/state?workspace=beta"),
    );

    const alphaJson = (await alphaState.json()) as {
      data: {
        state: {
          materials: Array<{ title: string }>;
          profileFields: {
            testingStatus: {
              status: string;
            };
          };
        };
      };
    };
    const betaJson = (await betaState.json()) as {
      data: {
        state: {
          materials: Array<{ title: string }>;
          profileFields: {
            testingStatus: {
              status: string;
            };
          };
        };
      };
    };

    expect(alphaJson.data.state.materials[0]?.title).toBe("Alpha SAT");
    expect(alphaJson.data.state.profileFields.testingStatus.status).toBe("known");
    expect(betaJson.data.state.materials).toHaveLength(0);
    expect(betaJson.data.state.profileFields.testingStatus.status).toBe("unconfirmed");
  });

  it("returns the selected persona for the requested workspace on follow-up state reads", async () => {
    await postPersona(
      new Request("http://localhost/api/demo/persona?workspace=alpha", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug: "first-gen-ambition-builder",
        }),
      }),
    );

    const alphaState = await getState(
      new Request("http://localhost/api/demo/state?workspace=alpha"),
    );
    const betaState = await getState(
      new Request("http://localhost/api/demo/state?workspace=beta"),
    );

    const alphaJson = (await alphaState.json()) as {
      data: {
        demoPersona: {
          selectedSlug: string;
        };
        state: {
          studentProfile: {
            firstName: string;
          };
        };
      };
    };
    const betaJson = (await betaState.json()) as {
      data: {
        demoPersona: {
          selectedSlug: string;
        };
        state: {
          studentProfile: {
            firstName: string;
          };
        };
      };
    };

    expect(alphaJson.data.demoPersona.selectedSlug).toBe("first-gen-ambition-builder");
    expect(alphaJson.data.state.studentProfile.firstName).toBe("Maya");
    expect(betaJson.data.demoPersona.selectedSlug).toBe("strategic-stem-striver");
    expect(betaJson.data.state.studentProfile.firstName).toBe("Demo Student");
  });

  it("returns deployment readiness details for the hosted demo", async () => {
    const response = await getReadiness();
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        persistenceKind: string;
        hasDatabaseUrl: boolean;
        isDurable: boolean;
        readyForSharedDemo: boolean;
        blocker: string | null;
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.persistenceKind).toBe("memory");
    expect(json.data.hasDatabaseUrl).toBe(false);
    expect(json.data.isDurable).toBe(false);
    expect(json.data.readyForSharedDemo).toBe(false);
    expect(json.data.blocker).toMatch(/database_url/i);
  });

  it("applies a SAT material submission and returns the latest patch and brief", async () => {
    const response = await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "March SAT",
            content: "New SAT update: Math 760, Reading and Writing 730.",
          },
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        latestPatch: {
          summary: string;
          status: string;
        } | null;
        materialAnalysis: {
          materialType: string;
          patchStatus: string;
          extractedFacts: string[];
          affectedFields: string[];
          profileImpact: string;
        } | null;
        weeklyBrief: {
          whatChanged: string;
        };
        state: {
          household: {
            timezone: string;
          };
          studentProfile: {
            firstName: string;
            gradeLevel: string;
          };
          profileFields: {
            testingStatus: {
              value: string;
              status: string;
            };
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.state.household.timezone).toBe("America/Los_Angeles");
    expect(json.data.state.studentProfile.firstName).toBe("Demo Student");
    expect(json.data.state.studentProfile.gradeLevel).toBe("11th grade");
    expect(json.data.latestPatch?.summary).toContain("SAT Math 760");
    expect(json.data.latestPatch?.status).toBe("applied");
    expect(json.data.materialAnalysis?.patchStatus).toBe("applied");
    expect(json.data.materialAnalysis?.materialType).toBe("test_score");
    expect(json.data.materialAnalysis?.extractedFacts).toContain("SAT Math 760");
    expect(json.data.materialAnalysis?.affectedFields).toContain("testingStatus");
    expect(json.data.weeklyBrief.whatChanged).toContain("SAT");
    expect(json.data.state.profileFields.testingStatus.value).toContain("760");
    expect(json.data.state.profileFields.testingStatus.status).toBe("known");
  });

  it("returns needs confirmation for an ambiguous school list submission", async () => {
    const response = await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        latestPatch: {
          status: string;
        } | null;
        materialAnalysis: {
          patchStatus: string;
          affectedFields: string[];
        } | null;
        state: {
          pendingPatch: {
            status: string;
          } | null;
          profileFields: {
            schoolList: {
              status: string;
            };
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.latestPatch?.status).toBe("needs_confirmation");
    expect(json.data.materialAnalysis?.patchStatus).toBe("needs_confirmation");
    expect(json.data.materialAnalysis?.affectedFields).toContain("schoolList");
    expect(json.data.state.pendingPatch?.status).toBe("needs_confirmation");
    expect(json.data.state.profileFields.schoolList.status).not.toBe("known");
  });

  it("returns conflict for a test score submission that contradicts known testing state", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "March SAT",
            content: "New SAT update: Math 760, Reading and Writing 730.",
          },
        }),
      }),
    );

    const response = await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "Conflicting SAT",
            content: "Updated SAT update: Math 700, Reading and Writing 680.",
          },
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        latestPatch: {
          status: string;
        } | null;
        materialAnalysis: {
          patchStatus: string;
          affectedFields: string[];
        } | null;
        state: {
          pendingPatch: {
            status: string;
          } | null;
          profileFields: {
            testingStatus: {
              value: string;
              status: string;
            };
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.latestPatch?.status).toBe("conflict");
    expect(json.data.materialAnalysis?.patchStatus).toBe("conflict");
    expect(json.data.materialAnalysis?.affectedFields).toContain("testingStatus");
    expect(json.data.state.pendingPatch?.status).toBe("conflict");
    expect(json.data.state.profileFields.testingStatus.value).toContain("760");
    expect(json.data.state.profileFields.testingStatus.status).toBe("known");
  });

  it("persists material updates across demo route calls", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "March SAT",
            content: "New SAT update: Math 760, Reading and Writing 730.",
          },
        }),
      }),
    );

    const followUpState = await getState(new Request("http://localhost/api/demo/state"));
    const json = (await followUpState.json()) as {
      ok: boolean;
      data: {
        state: {
          materials: Array<{ title: string }>;
          profileFields: {
            testingStatus: {
              value: string;
              status: string;
            };
          };
        };
      };
    };

    expect(json.data.state.materials[0]?.title).toBe("March SAT");
    expect(json.data.state.profileFields.testingStatus.status).toBe("known");
    expect(json.data.state.profileFields.testingStatus.value).toContain("760");
  });

  it("returns onboarding guidance for a first-run conversation update", async () => {
    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "We do not have a school list yet, but we want selective engineering programs.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          content: string;
          missingProfileFields: string[];
          nextPromptType: string;
        };
        state: {
          household: {
            timezone: string;
          };
          studentProfile: {
            firstName: string;
            majorDirection: string | null;
          };
          profileFields: {
            currentFocus: {
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
            whatMatters: string;
            topActions: string[];
          };
          conversation: string[];
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.state.household.timezone).toBe("America/Los_Angeles");
    expect(json.data.state.studentProfile.firstName).toBe("Demo Student");
    expect(json.data.state.studentProfile.majorDirection).toMatch(/engineering/i);
    expect(json.data.reply.goal).toBe("deliver_brief");
    expect(json.data.reply.missingProfileFields).toContain("testingStatus");
    expect(json.data.reply.nextPromptType).toBe("deliver_initial_guidance");
    expect(json.data.reply.content).toMatch(/current understanding/i);
    expect(json.data.reply.content).toMatch(/top priority/i);
    expect(json.data.reply.content).toMatch(/SAT|ACT|school list/i);
    expect(json.data.state.profileFields.currentFocus.value).toMatch(/testing|school list|priority/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/starter understanding|clearer starter/i);
    expect(json.data.state.weeklyBrief.whatMatters).toMatch(/testing|school list/i);
    expect(json.data.state.weeklyBrief.topActions.join(" ")).toMatch(/SAT|ACT|school list/i);
    expect(json.data.state.conversation[0]).toMatch(/Welcome back/i);
    expect(json.data.state.conversation[1]).toMatch(/Guided interview/i);
    expect(json.data.state.conversation.at(-2)).toMatch(/Family:/);
    expect(json.data.state.conversation.at(-1)).toMatch(/Current understanding:/i);
  });

  it("persists conversation updates across demo route calls", async () => {
    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "We do not have a school list yet, but we want selective engineering programs.",
        }),
      }),
    );

    const followUpState = await getState(new Request("http://localhost/api/demo/state"));
    const json = (await followUpState.json()) as {
      data: {
        state: {
          conversation: string[];
        };
      };
    };

    expect(json.data.state.conversation[0]).toMatch(/Welcome back/i);
    expect(json.data.state.conversation[1]).toMatch(/Guided interview/i);
    expect(json.data.state.conversation.at(-2)).toMatch(/Family:/);
    expect(json.data.state.conversation.at(-1)).toMatch(/Coach:/);
  });

  it("returns confirm_patch when a pending school list confirmation exists", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "What should I do next?",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          content: string;
          nextPromptType: string;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("confirm_patch");
    expect(json.data.reply.nextPromptType).toBe("confirm_school_list");
    expect(json.data.reply.content).toMatch(/confirm|school list|shortlist/i);
  });

  it("returns follow_up_action after a brief-driving applied update", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "March SAT",
            content: "New SAT update: Math 760, Reading and Writing 730.",
          },
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Thanks, what now?",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          content: string;
          nextPromptType: string;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("advance_school_list");
    expect(json.data.reply.content).toMatch(/school list|reach|target|next step/i);
  });

  it("applies a confirmed school list through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          pendingPatch: unknown;
          profileFields: {
            schoolList: {
              status: string;
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("confirm_patch");
    expect(json.data.reply.nextPromptType).toBe("advance_school_list");
    expect(json.data.state.pendingPatch).toBeNull();
    expect(json.data.state.profileFields.schoolList.status).toBe("known");
    expect(json.data.state.profileFields.schoolList.value).toContain("Purdue");
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/school list/i);
  });

  it("resolves a testing conflict through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "March SAT",
            content: "New SAT update: Math 760, Reading and Writing 730.",
          },
        }),
      }),
    );

    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "test_score",
            title: "Conflicting SAT",
            content: "Updated SAT update: Math 700, Reading and Writing 680.",
          },
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Use the newer 700 and 680 score.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          pendingPatch: unknown;
          profileFields: {
            testingStatus: {
              status: string;
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("resolve_conflict");
    expect(json.data.reply.nextPromptType).toBe("advance_school_list");
    expect(json.data.state.pendingPatch).toBeNull();
    expect(json.data.state.profileFields.testingStatus.status).toBe("known");
    expect(json.data.state.profileFields.testingStatus.value).toContain("700");
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/testing|SAT/i);
  });

  it("turns a confirmed school list into bucketed execution guidance through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          profileFields: {
            schoolList: {
              status: string;
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("clarify_deadline_strategy");
    expect(json.data.reply.content).toMatch(/bucket|reach|target/i);
    expect(json.data.state.profileFields.schoolList.status).toBe("known");
    expect(json.data.state.profileFields.schoolList.value).toMatch(/Reach:/i);
    expect(json.data.state.profileFields.schoolList.value).toMatch(/Target:/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/bucket|school list/i);
  });

  it("turns bucketed schools into a deadline-aware execution update through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          profileFields: {
            applicationTiming: {
              status: string;
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
            topActions: string[];
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("advance_deadline_strategy");
    expect(json.data.reply.content).toMatch(/deadline|timing|early|regular/i);
    expect(json.data.state.profileFields.applicationTiming.status).toBe("known");
    expect(json.data.state.profileFields.applicationTiming.value).toMatch(/Early:/i);
    expect(json.data.state.profileFields.applicationTiming.value).toMatch(/Regular:/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/deadline|timing|early|regular/i);
    expect(json.data.state.weeklyBrief.topActions.join(" ")).toMatch(/deadline|early|regular/i);
  });

  it("turns timing strategy into story and material priorities through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          profileFields: {
            currentFocus: {
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
            topActions: string[];
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("advance_story_priority");
    expect(json.data.reply.content).toMatch(/story|material|priority|early/i);
    expect(json.data.state.profileFields.currentFocus.value).toMatch(/story|material|priority/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/story|material|priority/i);
    expect(json.data.state.weeklyBrief.topActions.join(" ")).toMatch(/leadership|STEM|early|material/i);
  });

  it("turns story priorities into an execution-progress update through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          profileFields: {
            currentFocus: {
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
            topActions: string[];
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("track_execution_progress");
    expect(json.data.reply.content).toMatch(/draft|evidence|execution|next/i);
    expect(json.data.state.profileFields.currentFocus.value).toMatch(/Purdue|Georgia Tech|draft|evidence/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/draft|evidence|progress|execution/i);
    expect(json.data.state.weeklyBrief.topActions.join(" ")).toMatch(/finish|evidence|early/i);
  });

  it("turns execution progress into blocker-resolution guidance through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "We are blocked because Purdue still needs a stronger leadership example and Georgia Tech needs clearer robotics proof.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          profileFields: {
            currentFocus: {
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
            topActions: string[];
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("resolve_execution_blocker");
    expect(json.data.reply.content).toMatch(/blocked|leadership|robotics|proof|next/i);
    expect(json.data.state.profileFields.currentFocus.value).toMatch(/blocker|leadership|robotics|proof/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/blocker|leadership|robotics|proof/i);
    expect(json.data.state.weeklyBrief.topActions.join(" ")).toMatch(/leadership|robotics|proof|evidence/i);
  });

  it("turns resolved blockers into a ready-to-ship action list through the conversation route", async () => {
    await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "school_list",
            title: "Maybe schools",
            content: "Maybe some options are Purdue, Georgia Tech, UT Austin, and a few UC schools.",
          },
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Yes, that is our current shortlist. Please use Purdue, Georgia Tech, and UT Austin.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Purdue and Georgia Tech are reach schools for us. UT Austin is target.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Purdue and Georgia Tech are early action for us. UT Austin is regular decision, and we do not want binding early decision.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "For Purdue and Georgia Tech, our top material priority is leadership and STEM project stories first. UT Austin can wait until after early rounds.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "We drafted the Purdue leadership story and collected robotics evidence for Georgia Tech this week.",
        }),
      }),
    );

    await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "We are blocked because Purdue still needs a stronger leadership example and Georgia Tech needs clearer robotics proof.",
        }),
      }),
    );

    const response = await postConversation(
      new Request("http://localhost/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message:
            "We now have the Purdue leadership example and clearer robotics proof for Georgia Tech, so those blockers are resolved.",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data: {
        reply: {
          goal: string;
          nextPromptType: string;
          content: string;
        };
        state: {
          profileFields: {
            currentFocus: {
              value: string;
            };
          };
          weeklyBrief: {
            whatChanged: string;
            topActions: string[];
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.reply.goal).toBe("follow_up_action");
    expect(json.data.reply.nextPromptType).toBe("ship_ready_actions");
    expect(json.data.reply.content).toMatch(/ready|ship|polish|submit|final/i);
    expect(json.data.state.profileFields.currentFocus.value).toMatch(/ready|ship|final|polish/i);
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/resolved|ready|final/i);
    expect(json.data.state.weeklyBrief.topActions.join(" ")).toMatch(/final|polish|submit|review/i);
  });

  it("switches the demo persona and keeps the new scenario on follow-up state reads", async () => {
    const switchResponse = await postPersona(
      new Request("http://localhost/api/demo/persona", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug: "first-gen-ambition-builder",
        }),
      }),
    );

    const switched = (await switchResponse.json()) as {
      ok: boolean;
      data: {
        state: {
          household: {
            timezone: string;
          };
          studentProfile: {
            firstName: string;
            majorDirection: string | null;
          };
          weeklyBrief: {
            whatMatters: string;
          };
        };
      };
    };

    expect(switchResponse.status).toBe(200);
    expect(switched.ok).toBe(true);
    expect(switched.data.state.household.timezone).toBe("America/Chicago");
    expect(switched.data.state.studentProfile.firstName).toBe("Maya");
    expect(switched.data.state.studentProfile.majorDirection).toMatch(/business|economics/i);
    expect(switched.data.state.weeklyBrief.whatMatters).toMatch(/afford|school list/i);

    const followUpState = await getState(new Request("http://localhost/api/demo/state"));
    const followUpJson = (await followUpState.json()) as {
      data: {
        state: {
          household: {
            timezone: string;
          };
          studentProfile: {
            firstName: string;
          };
        };
      };
    };

    expect(followUpJson.data.state.household.timezone).toBe("America/Chicago");
    expect(followUpJson.data.state.studentProfile.firstName).toBe("Maya");
  });

  it("rejects an invalid material payload", async () => {
    const response = await postMaterial(
      new Request("http://localhost/api/demo/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: "made_up",
            title: "Broken payload",
            content: "Nope",
          },
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      error: string;
    };

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/invalid material draft/i);
  });
});
