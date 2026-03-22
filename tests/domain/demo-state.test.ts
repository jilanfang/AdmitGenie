import {
  createInitialDemoState,
  submitMaterialDraft,
} from "@/lib/domain/demo-state";

describe("demo-state", () => {
  it("starts with a coach-led weekly brief and missing information markers", () => {
    const state = createInitialDemoState();

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
  });
});

