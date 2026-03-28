import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/components/coach-shell", () => ({
  CoachShell: () => <div>Coach shell rendered</div>,
}));

describe("HomePage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    vi.resetModules();
  });

  it("shows the pilot access gate when no session cookie is present", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    const { default: HomePage } = await import("@/app/page");
    const page = await HomePage({});

    render(page);

    expect(screen.getByText(/Closed pilot access/i)).toBeInTheDocument();
    expect(screen.getByText(/Open your active case\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pilot invite/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open the case/i })).toBeInTheDocument();
  });

  it("renders the coach shell after pilot access is granted", async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "admitgenie-pilot-session"
          ? {
              value: "granted",
            }
          : undefined,
    });

    const { default: HomePage } = await import("@/app/page");
    const page = await HomePage({});

    render(page);

    expect(screen.getByText("Coach shell rendered")).toBeInTheDocument();
  });
});
