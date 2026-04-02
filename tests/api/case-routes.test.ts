import { POST as postCaseConversation } from "@/app/api/case/conversation/route";
import { POST as postCaseMaterials } from "@/app/api/case/materials/route";
import { GET as getCaseReadiness } from "@/app/api/case/readiness/route";
import { GET as getCaseState } from "@/app/api/case/state/route";
import { POST as postSessionAccess } from "@/app/api/session/access/route";
import { resetDemoPersistenceForTests } from "@/lib/server/persistence";

async function createPilotSessionCookie(inviteToken = "admitgenie-family-pilot") {
  const response = await postSessionAccess(
    new Request("http://localhost/api/session/access", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        inviteToken,
      }),
    }),
  );

  return {
    response,
    cookie: response.headers.get("set-cookie"),
  };
}

describe("case api routes", () => {
  beforeEach(() => {
    resetDemoPersistenceForTests();
  });

  it("grants pilot access and sets a case session cookie", async () => {
    const { response, cookie } = await createPilotSessionCookie();
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        authorized: boolean;
        caseId: string;
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.authorized).toBe(true);
    expect(json.data.caseId).toBe("pilot-family-case");
    expect(cookie).toMatch(/admitgenie-pilot-session=/);
  });

  it("creates a blank private case and returns a private return url", async () => {
    const response = await postSessionAccess(
      new Request("http://localhost/api/session/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "start_new_plan",
        }),
      }),
    );
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        authorized: boolean;
        caseId: string;
        returnUrl: string;
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.authorized).toBe(true);
    expect(json.data.caseId).toMatch(/^private-case-/);
    expect(json.data.returnUrl).toMatch(/^\/\?invite=private-access-/);
    expect(json.data.returnUrl).toContain("&entry=private");
    expect(response.headers.get("set-cookie")).toMatch(/admitgenie-pilot-session=/);
  });

  it("returns a blank starter case state for a newly created private case", async () => {
    const sessionResponse = await postSessionAccess(
      new Request("http://localhost/api/session/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "start_new_plan",
        }),
      }),
    );
    const cookie = sessionResponse.headers.get("set-cookie");
    const response = await getCaseState(
      new Request("http://localhost/api/case/state", {
        headers: cookie ? { cookie } : {},
      }),
    );
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        state: {
          caseRecord: {
            id: string;
            displayName: string;
          };
          studentProfile: {
            gradeLevel: string;
          };
          weeklyBrief: {
            whatChanged: string;
          };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.state.caseRecord.id).toMatch(/^private-case-/);
    expect(json.data.state.caseRecord.displayName).toBe("New admissions plan");
    expect(json.data.state.studentProfile.gradeLevel).toBe("Not confirmed yet");
    expect(json.data.state.weeklyBrief.whatChanged).toMatch(/blank starting point/i);
  });

  it("rejects case state reads without a pilot session", async () => {
    const response = await getCaseState(new Request("http://localhost/api/case/state"));
    const json = (await response.json()) as {
      ok: boolean;
      error: string;
    };

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/pilot session/i);
  });

  it("returns the authorized case state with readiness and case identity", async () => {
    const { cookie } = await createPilotSessionCookie();
    const response = await getCaseState(
      new Request("http://localhost/api/case/state", {
        headers: cookie ? { cookie } : {},
      }),
    );
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        state: {
          caseRecord: {
            id: string;
            displayName: string;
          };
          studentProfile: {
            gradeLevel: string;
          };
        };
        readiness: {
          databaseReady: boolean;
          openAiConfigured: boolean;
          requestCap: number;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.state.caseRecord.id).toBe("pilot-family-case");
    expect(json.data.state.caseRecord.displayName).toBe("Ava Chen");
    expect(json.data.state.studentProfile.gradeLevel).toBe("11th grade");
    expect(json.data.readiness.requestCap).toBe(120);
  });

  it("routes an authorized chat turn through the case conversation endpoint", async () => {
    const { cookie } = await createPilotSessionCookie();
    const response = await postCaseConversation(
      new Request("http://localhost/api/case/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify({
          message: "We do not have a school list yet and need help building one.",
        }),
      }),
    );
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        state: {
          conversation: string[];
        };
        routing: {
          responseMode: string;
          writeExecuted: boolean;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.state.conversation.at(-2)).toMatch(/Family:/i);
    expect(json.data.routing.responseMode).toBe("chat_only");
    expect(json.data.routing.writeExecuted).toBe(true);
  });

  it("rejects oversized material uploads for the pilot path", async () => {
    const { cookie } = await createPilotSessionCookie();
    const response = await postCaseMaterials(
      new Request("http://localhost/api/case/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify({
          draft: {
            type: "freeform_note",
            title: "Huge note",
            content: "a".repeat(20_001),
          },
        }),
      }),
    );
    const json = (await response.json()) as {
      ok: boolean;
      error: string;
    };

    expect(response.status).toBe(413);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/too large/i);
  });

  it("stores authorized materials and returns routing metadata", async () => {
    const { cookie } = await createPilotSessionCookie();
    const response = await postCaseMaterials(
      new Request("http://localhost/api/case/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
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
          status: string;
          summary: string;
        } | null;
        routing: {
          responseMode: string;
          writeExecuted: boolean;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.latestPatch?.status).toBe("applied");
    expect(json.data.latestPatch?.summary).toContain("SAT Math 760");
    expect(json.data.routing.responseMode).toBe("chat_only");
    expect(json.data.routing.writeExecuted).toBe(true);
  });

  it("reports external pilot readiness from the neutral case route", async () => {
    const response = await getCaseReadiness();
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        persistenceKind: string;
        durableMode: boolean;
        requestCap: number;
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.persistenceKind).toBe("memory");
    expect(json.data.durableMode).toBe(false);
    expect(json.data.requestCap).toBe(120);
  });
});
