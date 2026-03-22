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
    const response = await getState();
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
    expect(json.data.weeklyBrief.whatChanged).toContain("SAT");
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

    const followUpState = await getState();
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

  it("returns a coach reply for a conversation update", async () => {
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
        };
        state: {
          household: {
            timezone: string;
          };
          studentProfile: {
            firstName: string;
            majorDirection: string | null;
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
    expect(json.data.reply.goal).toBe("clarify_profile");
    expect(json.data.reply.missingProfileFields).toContain("testingStatus");
    expect(json.data.reply.content).toMatch(/school list|testing/i);
    expect(json.data.state.conversation[0]).toMatch(/Coach:/);
    expect(json.data.state.conversation[1]).toMatch(/Family:/);
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

    const followUpState = await getState();
    const json = (await followUpState.json()) as {
      data: {
        state: {
          conversation: string[];
        };
      };
    };

    expect(json.data.state.conversation[0]).toMatch(/Coach:/);
    expect(json.data.state.conversation[1]).toMatch(/Family:/);
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

    const followUpState = await getState();
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
