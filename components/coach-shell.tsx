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

const composerButtonStyle = {
  border: "1px solid var(--chat-line)",
  borderRadius: "999px",
  background: "var(--chat-surface)",
  color: "var(--chat-ink)",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
} as const;

const WORKSPACE_STORAGE_KEY = "admitgenie-workspace";

export function CoachShell() {
  const [state, setState] = useState<CoachSnapshot | null>(null);
  const [demoPersona, setDemoPersona] = useState<DemoPersonaConfig | null>(null);
  const [deployment, setDeployment] = useState<DemoDeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingMaterial, setIsApplyingMaterial] = useState(false);
  const [isSendingConversation, setIsSendingConversation] = useState(false);
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [conversationDraft, setConversationDraft] = useState("");
  const [materialComposerMode, setMaterialComposerMode] =
    useState<MaterialComposerMode>("closed");
  const [materialComposer, setMaterialComposer] =
    useState<MaterialComposerState>(DEFAULT_COMPOSER_STATE);
  const [workspaceCode, setWorkspaceCode] = useState("");

  useEffect(() => {
    let active = true;
    const workspace = ensureWorkspaceCode();
    setWorkspaceCode(workspace);

    const loadState = async () => {
      const payload = await fetchDemoState(workspace);

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
      }, workspaceCode);
      setState(nextState);
    } finally {
      setIsApplyingMaterial(false);
    }
  };

  const reloadState = async (workspace: string) => {
    setIsLoading(true);

    try {
      const payload = await fetchDemoState(workspace);
      setState(payload.data?.state ?? null);
      setDemoPersona(payload.data?.demoPersona ?? null);
      setDeployment(payload.data?.deployment ?? null);
      setIsBriefOpen(false);
      setConversationDraft("");
      closeMaterialComposer();
    } finally {
      setIsLoading(false);
    }
  };

  const sendConversation = async (message: string) => {
    setIsSendingConversation(true);

    try {
      const response = await fetch("/api/demo/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message,
          workspace: workspaceCode,
        }),
      });
      const payload = (await response.json()) as {
        data?: {
          state: CoachSnapshot;
        };
      };
      setState(payload.data?.state ?? null);
      setIsBriefOpen(false);
      setConversationDraft("");
    } finally {
      setIsSendingConversation(false);
    }
  };

  const handleConversationSubmit = async () => {
    const message = conversationDraft.trim();

    if (message.length === 0) {
      return;
    }

    await sendConversation(message);
  };

  const switchPersona = async (slug: string) => {
    setIsSwitchingPersona(true);

    try {
      const response = await fetch("/api/demo/persona", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ slug, workspace: workspaceCode }),
      });
      const payload = (await response.json()) as DemoStatePayload;
      setState(payload.data?.state ?? null);
      setDemoPersona(payload.data?.demoPersona ?? null);
      setIsBriefOpen(false);
      setConversationDraft("");
      closeMaterialComposer();
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  const leaveDemo = async () => {
    await fetch("/api/demo/logout", {
      method: "POST",
    });
    window.location.reload();
  };

  const startNewChat = async () => {
    const nextWorkspace = createWorkspaceCode();
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, nextWorkspace);
    setWorkspaceCode(nextWorkspace);
    await reloadState(nextWorkspace);
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

  const updateMaterialComposer = (next: Partial<MaterialComposerState>) => {
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
      }, workspaceCode);
      setState(nextState);
      if (nextState?.materialAnalysis[0]?.patchStatus) {
        setIsBriefOpen(false);
      }
      closeMaterialComposer();
    } finally {
      setIsApplyingMaterial(false);
    }
  };

  if (isLoading || !state) {
    return (
      <main className="coach-shell-page">
        <div className="coach-shell-loading">Loading AdmitGenie...</div>
      </main>
    );
  }

  const visibleFields = [
    state.profileFields.gradeLevel,
    {
      label: "Direction",
      value: state.studentProfile.majorDirection ?? "No major direction confirmed yet",
      status: "known" as const,
    },
    state.profileFields.currentFocus,
    state.profileFields.testingStatus,
    state.profileFields.schoolList,
    state.profileFields.applicationTiming,
  ];
  const missingFields = Object.values(state.profileFields).filter(
    (field) => field.status !== "known",
  );
  const recentMaterials = state.materials.slice(0, 3);
  const latestMaterialAnalysis = state.materialAnalysis[0] ?? null;
  const shouldShowBriefEntry = latestMaterialAnalysis !== null;

  return (
    <main className="coach-shell-page">
      <div className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-sidebar__brand">
            <div className="chat-sidebar__logo">AG</div>
            <div>
              <div className="chat-sidebar__title">AdmitGenie</div>
              <div className="chat-sidebar__subtitle">AI admissions coach</div>
            </div>
          </div>

          <button
            className="chat-sidebar__new-chat"
            type="button"
            onClick={() => void startNewChat()}
          >
            New chat
          </button>

          <button
            className="chat-sidebar__secondary-action"
            type="button"
            onClick={() => void leaveDemo()}
          >
            Leave demo
          </button>

          {demoPersona?.canSwitch ? (
            <label className="chat-sidebar__control">
              <span>Demo persona</span>
              <select
                aria-label="Demo persona"
                value={demoPersona.selectedSlug}
                disabled={isSwitchingPersona}
                onChange={(event) => void switchPersona(event.target.value)}
              >
                {demoPersona.options.map((persona) => (
                  <option key={persona.slug} value={persona.slug}>
                    {persona.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="chat-sidebar__section">
            <div className="chat-sidebar__section-label">Recent chats</div>
            <div className="chat-thread chat-thread--active">
              First admissions plan
            </div>
            {demoPersona?.options.slice(0, 2).map((persona) => (
              <div key={persona.slug} className="chat-thread">
                {persona.name}
              </div>
            ))}
          </div>

          <div className="chat-sidebar__section">
            <div className="chat-sidebar__section-label">Workspace</div>
            <div className="chat-sidebar__workspace-code">{workspaceCode}</div>
          </div>

          <div className="chat-sidebar__section">
            <div className="chat-sidebar__section-label">Demo status</div>
            <div className="chat-sidebar__meta-card">
              <strong>
                {deployment?.readyForSharedDemo ? "Durable Vercel demo" : "Ephemeral local demo"}
              </strong>
              <span>
                {deployment?.readyForSharedDemo
                  ? "State is persisted across sessions for this workspace."
                  : "State is isolated by workspace, but memory mode resets when the process restarts."}
              </span>
            </div>
          </div>

          {demoPersona ? (
            <div className="chat-sidebar__section">
              <div className="chat-sidebar__section-label">Scenario</div>
              <div className="chat-sidebar__meta-card">
                <strong>
                  {demoPersona.options.find((persona) => persona.slug === demoPersona.selectedSlug)
                    ?.name ?? "Current scenario"}
                </strong>
                <span>
                  {demoPersona.options.find((persona) => persona.slug === demoPersona.selectedSlug)
                    ?.summary ?? "AI-native admissions coaching demo scenario."}
                </span>
              </div>
            </div>
          ) : null}

          <div className="chat-sidebar__footer">
            {state.studentProfile.firstName ?? "Student"}
          </div>
        </aside>

        <section className="chat-main">
          <header className="chat-main__header">
            <div className="chat-main__eyebrow">Coach-led intake</div>
            <h1 className="chat-main__title">Build your first admissions plan.</h1>
            <p className="chat-main__subtitle">
              I can help you build your first admissions plan through conversation,
              not a giant intake form. Start with your grade, what you&apos;re aiming
              for, and what feels most unclear right now.
            </p>
            {deployment && !deployment.readyForSharedDemo ? (
              <div className="chat-main__warning">
                <strong>Ephemeral demo mode</strong>
                <span>{deployment.blocker}</span>
              </div>
            ) : null}
            <div>
              <button
                style={composerButtonStyle}
                type="button"
                onClick={() => setIsBriefOpen((current) => !current)}
              >
                {isBriefOpen ? "Hide current brief" : "View current brief"}
              </button>
            </div>
          </header>

          <div className="chat-main__stream">
            {state.conversation.map((message, index) => {
                const isUser = message.startsWith("Family:");
                const bubbleClass = isUser
                  ? "chat-bubble chat-bubble--user"
                  : "chat-bubble chat-bubble--coach";
                const isOpening = index === 0;

                return (
                  <article key={`${message}-${index}`} className={bubbleClass}>
                    <div className="chat-bubble__label">
                      {isUser ? "You" : isOpening ? "Coach opening" : "Coach"}
                    </div>
                    <p>{message}</p>
                  </article>
                );
              })}

            {latestMaterialAnalysis ? (
              <article className="chat-bubble chat-bubble--system">
                <div className="chat-bubble__label">Material update</div>
                <p>{state.patches[0]?.summary}</p>
                <p className="chat-bubble__meta">
                  Patch status: {latestMaterialAnalysis.patchStatus}
                </p>
                <p className="chat-bubble__meta">
                  Affected fields: {latestMaterialAnalysis.affectedFields.join(", ")}
                </p>
                {latestMaterialAnalysis.extractedFacts.length > 0 ? (
                  <p className="chat-bubble__meta">
                    Extracted facts: {latestMaterialAnalysis.extractedFacts.join(", ")}
                  </p>
                ) : null}
                <p className="chat-bubble__meta">{latestMaterialAnalysis.profileImpact}</p>
                {shouldShowBriefEntry ? (
                  <button
                    className="chat-composer__send"
                    type="button"
                    onClick={() => setIsBriefOpen((current) => !current)}
                  >
                    {isBriefOpen ? "Hide latest brief" : "View latest brief"}
                  </button>
                ) : null}
              </article>
            ) : null}

            {isBriefOpen ? (
              <article className="chat-bubble chat-bubble--system">
                <div className="chat-bubble__label">Monthly brief</div>
                <p><strong>What changed</strong></p>
                <p>{state.weeklyBrief.whatChanged}</p>
                <p><strong>What matters now</strong></p>
                <p>{state.weeklyBrief.whatMatters}</p>
                <p><strong>Top actions</strong></p>
                <p>{state.weeklyBrief.topActions.join(" ")}</p>
                <p><strong>Risks</strong></p>
                <p>{state.weeklyBrief.risks.join(" ")}</p>
                <p><strong>Why this advice</strong></p>
                <p>{state.weeklyBrief.whyThisAdvice}</p>
              </article>
            ) : null}
          </div>

          <div className="chat-composer">
            <div className="chat-composer__tools">
              <button
                style={composerButtonStyle}
                type="button"
                onClick={() => openMaterialComposer("upload")}
              >
                Upload file
              </button>
              <button
                style={composerButtonStyle}
                type="button"
                onClick={() => openMaterialComposer("paste")}
              >
                Paste update
              </button>
              <button
                style={composerButtonStyle}
                type="button"
                onClick={() => void applySatUpdate()}
              >
                {isApplyingMaterial ? "Updating..." : "Try a SAT update"}
              </button>
            </div>

            <div className="chat-composer__surface">
              <label className="chat-composer__input-wrap">
                <span className="sr-only">Message coach</span>
                <textarea
                  aria-label="Message coach"
                  className="chat-composer__input"
                  value={conversationDraft}
                  onChange={(event) => setConversationDraft(event.target.value)}
                  placeholder="Tell the coach what grade you're in, what you're aiming for, and what feels most uncertain."
                />
              </label>
              <button
                className="chat-composer__send"
                type="button"
                onClick={() => void handleConversationSubmit()}
                disabled={isSendingConversation}
              >
                {isSendingConversation ? "Sending..." : "Send message"}
              </button>
            </div>

            {materialComposerMode !== "closed" ? (
              <div className="chat-material-sheet">
                <div className="chat-material-sheet__header">
                  <strong>
                    {materialComposerMode === "upload"
                      ? "Upload a text file"
                      : "Paste a new material update"}
                  </strong>
                  <button type="button" onClick={closeMaterialComposer}>
                    Cancel
                  </button>
                </div>

                <div className="chat-material-sheet__grid">
                  <label>
                    <span>Material type</span>
                    <select
                      aria-label="Material type"
                      value={materialComposer.type}
                      onChange={(event) =>
                        updateMaterialComposer({
                          type: event.target.value as MaterialType,
                        })
                      }
                    >
                      {MATERIAL_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
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
                    />
                  </label>
                </div>

                {materialComposerMode === "upload" ? (
                  <label className="chat-material-sheet__upload">
                    <span>File upload</span>
                    <input
                      aria-label="File upload"
                      type="file"
                      accept=".txt,.md,.csv,.json"
                      onChange={(event) => void handleFileUpload(event)}
                    />
                  </label>
                ) : null}

                <label className="chat-material-sheet__field">
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
                  />
                </label>

                {materialComposer.fileName ? (
                  <div className="chat-material-sheet__hint">
                    Loaded file: {materialComposer.fileName}
                  </div>
                ) : null}

                {materialComposer.error ? (
                  <div className="chat-material-sheet__error">
                    {materialComposer.error}
                  </div>
                ) : null}

                <button
                  className="chat-material-sheet__submit"
                  type="button"
                  onClick={() => void handleMaterialSubmit()}
                >
                  {isApplyingMaterial ? "Adding..." : "Add material"}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="chat-notebook">
          <section className="chat-notebook__card">
            <div className="chat-notebook__label">What I know</div>
            <div className="chat-notebook__list">
              {visibleFields.map((field) => (
                <article key={field.label} className="chat-notebook__item">
                  <div className="chat-notebook__item-label">{field.label}</div>
                  <div className="chat-notebook__item-value">{field.value}</div>
                  <div className={`chat-status chat-status--${field.status}`}>
                    {field.status}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="chat-notebook__card">
            <div className="chat-notebook__label">What’s missing</div>
            <div className="chat-notebook__list">
              {missingFields.slice(0, 3).map((field) => (
                <article key={field.label} className="chat-notebook__item">
                  <div className="chat-notebook__item-label">{field.label}</div>
                  <div className="chat-notebook__item-value">{field.value}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="chat-notebook__card">
            <div className="chat-notebook__label">Add material</div>
            <div className="chat-notebook__actions">
              <button
                style={composerButtonStyle}
                type="button"
                onClick={() => openMaterialComposer("upload")}
              >
                Upload file
              </button>
              <button
                style={composerButtonStyle}
                type="button"
                onClick={() => openMaterialComposer("paste")}
              >
                Paste update
              </button>
            </div>
            {recentMaterials.length > 0 ? (
              <div className="chat-notebook__recent">
                {recentMaterials.map((material) => (
                  <div key={material.id} className="chat-notebook__recent-item">
                    <strong>{material.title}</strong>
                    <span>{material.type.replaceAll("_", " ")}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {latestMaterialAnalysis ? (
            <section className="chat-notebook__card">
              <div className="chat-notebook__label">Latest material update</div>
              <div className="chat-notebook__list">
                <article className="chat-notebook__item">
                  <div className="chat-notebook__item-label">Patch status</div>
                  <div className="chat-notebook__item-value">
                    {latestMaterialAnalysis.patchStatus}
                  </div>
                </article>
                <article className="chat-notebook__item">
                  <div className="chat-notebook__item-label">Affected fields</div>
                  <div className="chat-notebook__item-value">
                    {latestMaterialAnalysis.affectedFields.join(", ")}
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {latestMaterialAnalysis ? (
            <section className="chat-notebook__card">
              <div className="chat-notebook__label">Current priorities</div>
              <div className="chat-notebook__list">
                {state.weeklyBrief.topActions.slice(0, 2).map((action) => (
                  <article key={action} className="chat-notebook__item">
                    <div className="chat-notebook__item-value">{action}</div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

async function submitMaterial(
  draft: MaterialDraft,
  workspace: string,
): Promise<CoachSnapshot | null> {
  const response = await fetch("/api/demo/materials", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ draft, workspace }),
  });
  const payload = (await response.json()) as {
    data?: {
      state: CoachSnapshot;
      materialAnalysis?: CoachSnapshot["materialAnalysis"][number] | null;
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

async function fetchDemoState(workspace: string): Promise<DemoStatePayload> {
  const response = await fetch(`/api/demo/state?workspace=${encodeURIComponent(workspace)}`);
  return (await response.json()) as DemoStatePayload;
}

function ensureWorkspaceCode(): string {
  const existing = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const next = createWorkspaceCode();
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, next);
  return next;
}

function createWorkspaceCode(): string {
  return `workspace-${Math.random().toString(36).slice(2, 10)}`;
}
