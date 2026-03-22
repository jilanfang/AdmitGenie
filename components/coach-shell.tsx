"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import type { MaterialDraft, MaterialType } from "@/lib/domain/demo-state";
import type {
  CoachSnapshot,
  DemoDeploymentStatus,
  DemoPersonaConfig,
} from "@/lib/server/persistence";

const MATERIAL_TYPE_OPTIONS: Array<{ value: MaterialType; label: string }> = [
  { value: "transcript", label: "Transcript" },
  { value: "test_score", label: "Test score" },
  { value: "activity_update", label: "Activity update" },
  { value: "award", label: "Award" },
  { value: "school_list", label: "School list" },
  { value: "essay_note", label: "Essay note" },
  { value: "freeform_note", label: "Freeform note" },
];

const shellStyles = {
  card: {
    background: "rgba(255, 250, 240, 0.92)",
    border: "1px solid var(--line)",
    borderRadius: "28px",
    boxShadow: "0 20px 60px rgba(20, 33, 61, 0.08)",
  },
  hero: {
    padding: "28px 28px 20px",
    display: "grid",
    gap: "18px",
  },
  conversation: {
    padding: "0 28px 28px",
    display: "grid",
    gap: "14px",
  },
  rail: {
    padding: "28px",
    display: "grid",
    gap: "18px",
    alignContent: "start" as const,
  },
  chip: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    color: "var(--muted)",
    fontSize: "0.9rem",
  },
  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    background: "var(--accent)",
    color: "#f8f5ee",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid var(--line)",
    borderRadius: "14px",
    padding: "12px 16px",
    background: "transparent",
    color: "var(--ink)",
    fontWeight: 600,
    cursor: "pointer",
  },
  toneCard: {
    border: "1px solid var(--line)",
    borderRadius: "20px",
    padding: "18px",
    background: "rgba(255,255,255,0.55)",
  },
  fieldLabel: {
    display: "grid",
    gap: "8px",
    fontSize: "0.9rem",
    color: "var(--muted)",
  },
  input: {
    width: "100%",
    borderRadius: "14px",
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.92)",
    color: "var(--ink)",
    padding: "12px 14px",
    font: "inherit",
  },
  textarea: {
    width: "100%",
    minHeight: "132px",
    borderRadius: "14px",
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.92)",
    color: "var(--ink)",
    padding: "12px 14px",
    font: "inherit",
    resize: "vertical" as const,
  },
} as const;

type MaterialComposerMode = "closed" | "paste" | "upload";

type MaterialComposerState = {
  type: MaterialType;
  title: string;
  content: string;
  fileName: string | null;
  error: string | null;
};

const DEFAULT_COMPOSER_STATE: MaterialComposerState = {
  type: "freeform_note",
  title: "",
  content: "",
  fileName: null,
  error: null,
};

export function CoachShell() {
  const [state, setState] = useState<CoachSnapshot | null>(null);
  const [demoPersona, setDemoPersona] = useState<DemoPersonaConfig | null>(null);
  const [deployment, setDeployment] = useState<DemoDeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingMaterial, setIsApplyingMaterial] = useState(false);
  const [isSendingConversation, setIsSendingConversation] = useState(false);
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
  const [materialComposerMode, setMaterialComposerMode] =
    useState<MaterialComposerMode>("closed");
  const [materialComposer, setMaterialComposer] =
    useState<MaterialComposerState>(DEFAULT_COMPOSER_STATE);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      const payload = await fetchDemoState();

      if (!active) {
        return;
      }

      setState(payload.data?.state ?? null);
      setDemoPersona(payload.data?.demoPersona ?? null);
      setDeployment(payload.data?.deployment ?? null);
      setIsLoading(false);
    };

    void loadState();

    return () => {
      active = false;
    };
  }, []);

  const applySatUpdate = async () => {
    setIsApplyingMaterial(true);

    try {
      const nextState = await submitMaterial({
        type: "test_score",
        title: "March SAT",
        content: "New SAT update: Math 760, Reading and Writing 730.",
      });
      setState(nextState);
    } finally {
      setIsApplyingMaterial(false);
    }
  };

  const sharePlanningUpdate = async () => {
    setIsSendingConversation(true);

    try {
      const response = await fetch("/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "We want selective engineering programs but do not have a school list yet.",
        }),
      });
      const payload = (await response.json()) as {
        data?: {
          state: CoachSnapshot;
        };
      };
      setState(payload.data?.state ?? null);
    } finally {
      setIsSendingConversation(false);
    }
  };

  const switchPersona = async (slug: string) => {
    setIsSwitchingPersona(true);

    try {
      const response = await fetch("/api/demo/persona", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ slug }),
      });
      const payload = (await response.json()) as DemoStatePayload;
      setState(payload.data?.state ?? null);
      setDemoPersona(payload.data?.demoPersona ?? null);
      closeMaterialComposer();
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  const openMaterialComposer = (mode: Exclude<MaterialComposerMode, "closed">) => {
    setMaterialComposerMode(mode);
    setMaterialComposer((current) => ({
      ...current,
      error: null,
    }));
  };

  const closeMaterialComposer = () => {
    setMaterialComposerMode("closed");
    setMaterialComposer(DEFAULT_COMPOSER_STATE);
  };

  const updateMaterialComposer = (
    next: Partial<MaterialComposerState>,
  ) => {
    setMaterialComposer((current) => ({
      ...current,
      ...next,
      error: next.error ?? null,
    }));
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      updateMaterialComposer({
        fileName: null,
        content: "",
        title: "",
      });
      return;
    }

    const content = await file.text();

    updateMaterialComposer({
      fileName: file.name,
      title: materialComposer.title.trim().length > 0 ? materialComposer.title : file.name,
      content,
    });
  };

  const handleMaterialSubmit = async () => {
    const title = materialComposer.title.trim();
    const content = materialComposer.content.trim();

    if (title.length === 0 || content.length === 0) {
      updateMaterialComposer({
        error: "Add both a title and material content before submitting.",
      });
      return;
    }

    setIsApplyingMaterial(true);

    try {
      const nextState = await submitMaterial({
        type: materialComposer.type,
        title,
        content,
      });
      setState(nextState);
      closeMaterialComposer();
    } finally {
      setIsApplyingMaterial(false);
    }
  };

  if (isLoading || !state) {
    return (
      <main className="coach-shell-page">
        <div style={{ maxWidth: "1400px", margin: "0 auto", color: "var(--muted)" }}>
          Loading Coach Inbox...
        </div>
      </main>
    );
  }

  return (
    <main className="coach-shell-page">
      <div className="coach-shell-frame">
        <section style={shellStyles.card}>
          <div style={shellStyles.hero}>
            <span style={shellStyles.chip}>AI-native guided interview</span>
            <div style={{ display: "grid", gap: "10px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(2.6rem, 4vw, 4.3rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                Coach Inbox
              </h1>
              <p
                style={{
                  margin: 0,
                  maxWidth: "52rem",
                  color: "var(--muted)",
                  fontSize: "1.06rem",
                  lineHeight: 1.6,
                }}
              >
                AdmitGenie starts as a guided conversation, not a form. The coach
                keeps a hidden structured profile, explains what it knows, and
                updates weekly guidance when new materials arrive.
              </p>
            </div>
            {demoPersona?.canSwitch ? (
              <label style={{ ...shellStyles.fieldLabel, maxWidth: "22rem" }}>
                <span>Demo persona</span>
                <select
                  aria-label="Demo persona"
                  value={demoPersona.selectedSlug}
                  disabled={isSwitchingPersona}
                  onChange={(event) => void switchPersona(event.target.value)}
                  style={shellStyles.input}
                >
                  {demoPersona.options.map((persona) => (
                    <option key={persona.slug} value={persona.slug}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {deployment && !deployment.readyForSharedDemo ? (
              <article
                style={{
                  ...shellStyles.toneCard,
                  borderColor: "rgba(166, 71, 42, 0.24)",
                  background:
                    "linear-gradient(180deg, rgba(255,245,236,0.96), rgba(255,255,255,0.9))",
                }}
              >
                <div style={{ fontSize: "0.84rem", color: "var(--alert)" }}>
                  Ephemeral demo mode
                </div>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                  {deployment.blocker}
                </p>
              </article>
            ) : null}
            <div className="coach-shell-summary-grid">
              <article
                style={{
                  ...shellStyles.toneCard,
                  background:
                    "linear-gradient(135deg, rgba(247,231,203,0.88), rgba(255,255,255,0.82))",
                }}
              >
                <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Student</div>
                <div style={{ marginTop: "6px", fontWeight: 800, fontSize: "1.24rem" }}>
                  {state.studentProfile.firstName ?? "Student profile"}
                </div>
                <div style={{ marginTop: "8px", color: "var(--muted)", lineHeight: 1.6 }}>
                  {state.studentProfile.gradeLevel}
                  {state.studentProfile.graduationYear
                    ? ` • Class of ${state.studentProfile.graduationYear}`
                    : ""}
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  {state.studentProfile.majorDirection ?? "No major direction confirmed yet"}
                </div>
              </article>
              <article style={shellStyles.toneCard}>
                <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Household</div>
                <div style={{ marginTop: "6px", fontWeight: 700, fontSize: "1rem" }}>
                  {state.household.timezone}
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "0.92rem",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {state.household.goalsSummary ?? "No household goal summary confirmed yet"}
                </div>
              </article>
              <article style={shellStyles.toneCard}>
                <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Coach posture</div>
                <div style={{ marginTop: "6px", fontWeight: 700, fontSize: "1rem" }}>
                  AI-native intake
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "0.92rem",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Hidden structured profile, visible explanations, and progressive updates as
                  new materials arrive.
                </div>
              </article>
            </div>
            <div className="coach-shell-profile-grid">
              {Object.values(state.profileFields).map((field) => (
                <article key={field.label} style={shellStyles.toneCard}>
                  <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>{field.label}</div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    {field.value}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "0.84rem",
                      color: field.status === "known" ? "var(--accent)" : "var(--warm)",
                    }}
                  >
                    {field.status}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div style={shellStyles.conversation}>
            {state.conversation.map((message, index) => (
              <article
                key={`${message}-${index}`}
                style={{
                  ...shellStyles.toneCard,
                  background:
                    index === 0
                      ? "linear-gradient(135deg, rgba(207,231,223,0.8), rgba(255,255,255,0.8))"
                      : "rgba(255,255,255,0.52)",
                }}
              >
                <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                  {index === 0 ? "Coach update" : "Conversation"}
                </div>
                <p
                  style={{
                    margin: "8px 0 0",
                    lineHeight: 1.6,
                    fontSize: "1rem",
                  }}
                >
                  {message}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside style={shellStyles.card}>
          <div style={shellStyles.rail}>
            <div style={{ display: "grid", gap: "8px" }}>
              <span style={shellStyles.chip}>Material Inbox</span>
              <h2 style={{ margin: 0, fontSize: "2rem", lineHeight: 1 }}>Weekly Brief</h2>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                The right rail shows how a new material changes the hidden profile and
                reshapes the brief.
              </p>
            </div>

            <article style={shellStyles.toneCard}>
              <strong style={{ display: "block", fontSize: "1rem" }}>What changed</strong>
              <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                {state.weeklyBrief.whatChanged}
              </p>
            </article>

            <article style={shellStyles.toneCard}>
              <strong style={{ display: "block", fontSize: "1rem" }}>What matters</strong>
              <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                {state.weeklyBrief.whatMatters}
              </p>
            </article>

            <article style={shellStyles.toneCard}>
              <strong style={{ display: "block", fontSize: "1rem" }}>Top actions</strong>
              <ol style={{ margin: "10px 0 0", paddingLeft: "18px", lineHeight: 1.8 }}>
                {state.weeklyBrief.topActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </article>

            <article style={shellStyles.toneCard}>
              <strong style={{ display: "block", fontSize: "1rem" }}>Why this advice</strong>
              <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                {state.weeklyBrief.whyThisAdvice}
              </p>
            </article>

            <article
              style={{
                ...shellStyles.toneCard,
                display: "grid",
                gap: "12px",
                borderColor: "rgba(13, 91, 80, 0.3)",
                background:
                  "linear-gradient(180deg, rgba(207,231,223,0.72), rgba(255,255,255,0.88))",
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "1rem" }}>Material inbox</strong>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                  Add real material updates by pasting notes or uploading a text-based file.
                  The coach will store the update, generate a patch summary, and refresh the
                  brief.
                </p>
              </div>
              <div className="coach-shell-action-grid">
                <button style={shellStyles.primaryButton} onClick={applySatUpdate}>
                  {isApplyingMaterial ? "Updating..." : "Try a SAT update"}
                </button>
                <button
                  style={shellStyles.secondaryButton}
                  type="button"
                  onClick={sharePlanningUpdate}
                >
                  {isSendingConversation ? "Sending..." : "Share planning update"}
                </button>
                <button
                  style={shellStyles.secondaryButton}
                  type="button"
                  onClick={() => openMaterialComposer("upload")}
                >
                  Upload file
                </button>
                <button
                  style={shellStyles.secondaryButton}
                  type="button"
                  onClick={() => openMaterialComposer("paste")}
                >
                  Paste update
                </button>
              </div>

              {materialComposerMode !== "closed" ? (
                <div className="coach-shell-composer" style={shellStyles.toneCard}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <strong style={{ fontSize: "1rem" }}>
                      {materialComposerMode === "upload"
                        ? "Upload a text file"
                        : "Paste a new material update"}
                    </strong>
                    <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                      MVP input layer: accept structured notes now, save OCR and richer parsing
                      for later.
                    </p>
                  </div>

                  <div className="coach-shell-composer-grid">
                    <label style={shellStyles.fieldLabel}>
                      <span>Material type</span>
                      <select
                        aria-label="Material type"
                        value={materialComposer.type}
                        onChange={(event) =>
                          updateMaterialComposer({
                            type: event.target.value as MaterialType,
                          })
                        }
                        style={shellStyles.input}
                      >
                        {MATERIAL_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={shellStyles.fieldLabel}>
                      <span>Title</span>
                      <input
                        aria-label="Title"
                        value={materialComposer.title}
                        onChange={(event) =>
                          updateMaterialComposer({
                            title: event.target.value,
                          })
                        }
                        placeholder="Name this update"
                        style={shellStyles.input}
                      />
                    </label>
                  </div>

                  {materialComposerMode === "upload" ? (
                    <label style={shellStyles.fieldLabel}>
                      <span>File upload</span>
                      <input
                        aria-label="File upload"
                        type="file"
                        accept=".txt,.md,.csv,.json"
                        onChange={(event) => void handleFileUpload(event)}
                        style={shellStyles.input}
                      />
                      <span style={{ fontSize: "0.82rem" }}>
                        Text-based files only for MVP. PDF and OCR parsing come later.
                      </span>
                    </label>
                  ) : null}

                  <label style={shellStyles.fieldLabel}>
                    <span>Material content</span>
                    <textarea
                      aria-label="Material content"
                      value={materialComposer.content}
                      onChange={(event) =>
                        updateMaterialComposer({
                          content: event.target.value,
                        })
                      }
                      placeholder="Paste a score update, activity note, school list, or family context."
                      style={shellStyles.textarea}
                    />
                  </label>

                  {materialComposer.fileName ? (
                    <div style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
                      Loaded file: {materialComposer.fileName}
                    </div>
                  ) : null}

                  {materialComposer.error ? (
                    <div style={{ color: "var(--alert)", fontSize: "0.9rem" }}>
                      {materialComposer.error}
                    </div>
                  ) : null}

                  <div className="coach-shell-action-grid">
                    <button
                      style={shellStyles.primaryButton}
                      type="button"
                      onClick={() => void handleMaterialSubmit()}
                    >
                      {isApplyingMaterial ? "Adding..." : "Add material"}
                    </button>
                    <button
                      style={shellStyles.secondaryButton}
                      type="button"
                      onClick={closeMaterialComposer}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </article>

            {state.materials.length > 0 ? (
              <article style={shellStyles.toneCard}>
                <strong style={{ display: "block", fontSize: "1rem" }}>Recent materials</strong>
                <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
                  {state.materials.slice(0, 3).map((material) => (
                    <div key={material.id}>
                      <div style={{ fontWeight: 700 }}>{material.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: "4px" }}>
                        {material.type.replaceAll("_", " ")}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {state.patches.length > 0 ? (
              <article style={shellStyles.toneCard}>
                <strong style={{ display: "block", fontSize: "1rem" }}>Latest patch</strong>
                <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>
                  {state.patches[0]?.summary}
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {state.patches[0]?.impact}
                </p>
              </article>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

async function submitMaterial(draft: MaterialDraft): Promise<CoachSnapshot | null> {
  const response = await fetch("/api/demo/materials", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ draft }),
  });
  const payload = (await response.json()) as {
    data?: {
      state: CoachSnapshot;
    };
  };

  return payload.data?.state ?? null;
}

type DemoStatePayload = {
  data?: {
    state: CoachSnapshot;
    demoPersona?: DemoPersonaConfig;
    deployment?: DemoDeploymentStatus;
  };
};

async function fetchDemoState(): Promise<DemoStatePayload> {
  const response = await fetch("/api/demo/state");
  return (await response.json()) as DemoStatePayload;
}
