import { POST as postAccess } from "@/app/api/demo/access/route";
import { POST as postLogout } from "@/app/api/demo/logout/route";
import { clearDemoAccessCookie, hasDemoAccess, isValidDemoAccessCode } from "@/lib/server/demo-access";

describe("demo access gate", () => {
  const originalAccessCode = process.env.DEMO_ACCESS_CODE;

  beforeEach(() => {
    process.env.DEMO_ACCESS_CODE = "demo-pass";
  });

  afterEach(() => {
    if (originalAccessCode === undefined) {
      delete process.env.DEMO_ACCESS_CODE;
    } else {
      process.env.DEMO_ACCESS_CODE = originalAccessCode;
    }
  });

  it("accepts the configured access code", () => {
    expect(isValidDemoAccessCode("demo-pass")).toBe(true);
    expect(isValidDemoAccessCode("wrong-pass")).toBe(false);
  });

  it("returns a cookie payload when the access code is valid", async () => {
    const response = await postAccess(
      new Request("http://localhost/api/demo/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          accessCode: "demo-pass",
        }),
      }),
    );

    const json = (await response.json()) as {
      ok: boolean;
      data?: {
        authorized: boolean;
      };
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data?.authorized).toBe(true);
    expect(response.headers.get("set-cookie")).toMatch(/admitgenie-demo-access=granted/i);
  });

  it("rejects an invalid access code", async () => {
    const response = await postAccess(
      new Request("http://localhost/api/demo/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          accessCode: "wrong-pass",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("reads and clears the demo access cookie", () => {
    expect(hasDemoAccess("admitgenie-demo-access=granted")).toBe(true);
    expect(hasDemoAccess("admitgenie-demo-access=denied")).toBe(false);

    const response = clearDemoAccessCookie();

    expect(response.headers.get("set-cookie")).toMatch(/admitgenie-demo-access=;/i);
  });

  it("clears the cookie through the logout route", async () => {
    const response = await postLogout(
      new Request("http://localhost/api/demo/logout", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/admitgenie-demo-access=;/i);
  });
});
