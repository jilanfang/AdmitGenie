import {
  ADMITGENIE_PERSONAS,
  buildPersonaDemoState,
  getDefaultPersona,
} from "@/lib/domain/personas";

describe("personas", () => {
  it("defines a reusable roster of North America family personas", () => {
    expect(ADMITGENIE_PERSONAS.length).toBeGreaterThanOrEqual(4);

    const slugs = ADMITGENIE_PERSONAS.map((persona) => persona.slug);
    expect(new Set(slugs).size).toBe(ADMITGENIE_PERSONAS.length);

    for (const persona of ADMITGENIE_PERSONAS) {
      expect(persona.regionFocus).toBe("North America");
      expect(persona.primaryUser).toBe("student_family");
      expect(persona.sampleMaterials.length).toBeGreaterThan(0);
      expect(persona.household.timezone.length).toBeGreaterThan(0);
      expect(persona.studentProfile.gradeLevel).toBe("11th grade");
    }
  });

  it("builds the default persona state for the strategic engineering family", () => {
    const persona = getDefaultPersona();
    const state = buildPersonaDemoState(persona.slug);

    expect(persona.studentProfile.majorDirection).toMatch(/engineering/i);
    expect(persona.keyTensions.join(" ")).toMatch(/school list|testing/i);
    expect(state.profileFields.gradeLevel.value).toBe("11th grade");
    expect(state.profileFields.currentFocus.value).toMatch(/school list|testing/i);
    expect(state.conversation[0]).toMatch(/engineering|selective/i);
    expect(state.weeklyBrief.whatMatters).toMatch(/school list|testing/i);
  });
});
