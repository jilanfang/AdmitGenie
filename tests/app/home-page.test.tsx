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
  });

  it("shows the demo access gate when no access cookie is present", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    const { default: HomePage } = await import("@/app/page");
    const page = await HomePage();

    render(page);

    expect(screen.getByText(/Enter Demo Access/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Use the shared demo access code to enter the AI-native coach inbox/i),
    ).toBeInTheDocument();
  });

  it("renders the coach shell after demo access is granted", async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "admitgenie-demo-access"
          ? {
              value: "granted",
            }
          : undefined,
    });

    const { default: HomePage } = await import("@/app/page");
    const page = await HomePage();

    render(page);

    expect(screen.getByText("Coach shell rendered")).toBeInTheDocument();
  });
});
