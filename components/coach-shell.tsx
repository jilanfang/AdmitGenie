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
  const [isWorkspacePanelOpen, setIsWorkspacePanelOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [conversationDraft, setConversationDraft] = useState("");
  const [materialComposerMode, setMaterialComposerMode] =
    useState<MaterialComposerMode>("closed");
  const [materialComposer, setMaterialComposer] =
    useState<MaterialComposerState>(DEFAULT_COMPOSER_STATE);
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [decisionSelection, setDecisionSelection] = useState<string[]>([]);

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
      setDecisionSelection([]);
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
      setDecisionSelection([]);
      setIsWorkspacePanelOpen(false);
      setIsAttachmentMenuOpen(false);
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
      setDecisionSelection([]);
      setIsAttachmentMenuOpen(false);
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
      setDecisionSelection([]);
      setIsWorkspacePanelOpen(false);
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
    setIsAttachmentMenuOpen(false);
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
        <div className="coach-shell-loading">Getting your coach ready...</div>
      </main>
    );
  }

  const latestMaterialAnalysis = state.materialAnalysis[0] ?? null;
  const shouldShowBriefEntry = latestMaterialAnalysis !== null;
  const latestDecisionCard = state.decisionCard;
  const suggestedReplies = state.suggestedReplies;
  const selectedPersona =
    demoPersona?.options.find((persona) => persona.slug === demoPersona.selectedSlug) ?? null;
  const isDecisionReady =
    latestDecisionCard?.type === "multi_select"
      ? decisionSelection.length > 0
      : decisionSelection.length === 1;

  const handleDecisionToggle = (value: string) => {
    if (!latestDecisionCard) {
      return;
    }

    setDecisionSelection((current) => {
      if (latestDecisionCard.type === "multi_select") {
        return current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
      }

      return current[0] === value ? [] : [value];
    });
  };

  const handleDecisionSubmit = async () => {
    if (!latestDecisionCard || !isDecisionReady) {
      return;
    }

    if (latestDecisionCard.type === "multi_select") {
      const schools = decisionSelection.join(", ");
      await sendConversation(`Yes, that is our current shortlist. Please use ${schools}.`);
      return;
    }

    const selectedOption = latestDecisionCard.options.find(
      (option) => option.value === decisionSelection[0],
    );

    if (!selectedOption) {
      return;
    }

    await sendConversation(selectedOption.value);
  };

  const handleSuggestedReply = async (message: string) => {
    await sendConversation(message);
  };

  const formatConversationMessage = (message: string) => {
    if (message.startsWith("Family: ")) {
      return message.replace(/^Family:\s*/, "");
    }

    if (message.startsWith("Coach: ")) {
      return message.replace(/^Coach:\s*/, "");
    }

    return message;
  };

  return (
    <main className="coach-shell-page">
      <div className="chat-shell">
        <button
          className="chat-shell__panel-toggle"
          type="button"
          aria-expanded={isWorkspacePanelOpen}
          aria-label="Open workspace panel"
          onClick={() => setIsWorkspacePanelOpen((current) => !current)}
        >
          More
        </button>

        {isWorkspacePanelOpen ? (
          <>
            <button
              className="chat-shell__panel-scrim"
              type="button"
              aria-label="Close workspace panel"
              onClick={() => setIsWorkspacePanelOpen(false)}
            />
            <aside className="chat-side-panel">
              <div className="chat-side-panel__header">
                <strong>Behind the scenes</strong>
                <button
                  type="button"
                  aria-label="Close workspace panel"
                  onClick={() => setIsWorkspacePanelOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="chat-side-panel__section">
                <button
                  style={composerButtonStyle}
                  type="button"
                  onClick={() => void startNewChat()}
                >
                  New chat
                </button>
                <button
                  style={composerButtonStyle}
                  type="button"
                  onClick={() => void applySatUpdate()}
                >
                  {isApplyingMaterial ? "Updating..." : "Try SAT sample"}
                </button>
              </div>

              {demoPersona?.canSwitch ? (
                <label className="chat-side-panel__field">
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

              <div className="chat-side-panel__note">
                <strong>{selectedPersona?.name ?? "Current scenario"}</strong>
                <p>{selectedPersona?.summary ?? "Current coaching scenario."}</p>
                <small>
                  {deployment?.readyForSharedDemo
                    ? "This case is running in durable mode and will still be here when you come back."
                    : "This case is running in local memory mode, so it resets if the demo restarts."}
                </small>
              </div>

              <div className="chat-side-panel__meta">
                <span>Workspace code: {workspaceCode}</span>
                {deployment?.blocker ? (
                  <small>{deployment.blocker}</small>
                ) : null}
              </div>

              <button
                className="chat-side-panel__link"
                type="button"
                onClick={() => void leaveDemo()}
              >
                Leave demo
              </button>
            </aside>
          </>
        ) : null}

        <section className="chat-main chat-main--single-column">
          <header className="sr-only">
            <h1>Let&apos;s figure out the next best step.</h1>
            <p>
              Tell me what grade you&apos;re in, what you&apos;re aiming for, or what feels most unclear.
              If you already have a score report, school list, or update, drop it here and I&apos;ll help you turn it into a plan.
            </p>
          </header>

          <div className="chat-main__stream">
            {state.conversation.map((message, index) => {
                const isUser = message.startsWith("Family:");
                const isOpeningCoach = !isUser && index < 2;
                const isSummaryCoach =
                  !isUser &&
                  /here's where i think things stand:|what i'd focus on this month:|what would help me guide you better next:/i.test(
                    message,
                  );
                const bubbleClass = [
                  "chat-bubble",
                  isUser ? "chat-bubble--user" : "chat-bubble--coach",
                  isOpeningCoach
                    ? index === 0
                      ? "chat-bubble--opening-primary"
                      : "chat-bubble--opening-secondary"
                    : "",
                  isSummaryCoach ? "chat-bubble--summary" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <article key={`${message}-${index}`} className={bubbleClass}>
                    <p>{formatConversationMessage(message)}</p>
                  </article>
                );
              })}

            {suggestedReplies.length > 0 ? (
              <article className="chat-bubble chat-bubble--coach chat-bubble--suggested">
                <div className="chat-bubble__label">You can say it like this</div>
                <div className="suggested-replies">
                  {suggestedReplies.map((reply) => (
                    <button
                      key={reply.id}
                      className="suggested-replies__option"
                      type="button"
                      onClick={() => void handleSuggestedReply(reply.message)}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              </article>
            ) : null}

            {latestMaterialAnalysis ? (
              <article className="chat-bubble chat-bubble--coach chat-bubble--insert">
                <div className="chat-bubble__label">A note from me</div>
                <p>{state.patches[0]?.summary}</p>
                <p className="chat-bubble__meta">{latestMaterialAnalysis.profileImpact}</p>
                {shouldShowBriefEntry ? (
                  <button
                    className="chat-composer__send"
                    type="button"
                    onClick={() => setIsBriefOpen((current) => !current)}
                  >
                    {isBriefOpen ? "Hide the extra detail" : "See why I'm saying that"}
                  </button>
                ) : null}
              </article>
            ) : null}

            {latestDecisionCard ? (
              <article className="chat-bubble chat-bubble--coach chat-bubble--decision chat-bubble--insert">
                <div className="chat-bubble__label">One thing to confirm</div>
                <p><strong>{latestDecisionCard.prompt}</strong></p>
                <p className="chat-bubble__meta">{latestDecisionCard.reason}</p>
                <div className="decision-card">
                  {latestDecisionCard.options.map((option) => {
                    const isSelected = decisionSelection.includes(option.value);

                    return (
                      <button
                        key={option.id}
                        className={`decision-card__option${isSelected ? " decision-card__option--selected" : ""}`}
                        type="button"
                        onClick={() => handleDecisionToggle(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  className="chat-composer__send"
                  type="button"
                  onClick={() => void handleDecisionSubmit()}
                  disabled={!isDecisionReady || isSendingConversation}
                >
                  {isSendingConversation ? "Saving..." : latestDecisionCard.submitLabel}
                </button>
              </article>
            ) : null}

            {isBriefOpen ? (
              <article className="chat-bubble chat-bubble--coach chat-bubble--insert">
                <div className="chat-bubble__label">Why I am taking this angle</div>
                <p>
                  <strong>What changed:</strong> {state.weeklyBrief.whatChanged}
                </p>
                <p>
                  <strong>What matters most right now:</strong> {state.weeklyBrief.whatMatters}
                </p>
                <p>
                  <strong>What I'd do next:</strong> {state.weeklyBrief.topActions.join(" ")}
                </p>
                <p>
                  <strong>What I want us to watch:</strong> {state.weeklyBrief.risks.join(" ")}
                </p>
                <p>
                  <strong>Why I'm taking this angle:</strong> {state.weeklyBrief.whyThisAdvice}
                </p>
              </article>
            ) : null}
          </div>

          <div className="chat-composer">
            {isAttachmentMenuOpen ? (
              <div className="chat-composer__attachment-menu">
                <button
                  style={composerButtonStyle}
                  type="button"
                  onClick={() => openMaterialComposer("upload")}
                >
                  Upload something
                </button>
                <button
                  style={composerButtonStyle}
                  type="button"
                  onClick={() => openMaterialComposer("paste")}
                >
                  Paste something
                </button>
              </div>
            ) : null}

            <div className="chat-composer__surface">
              <button
                className="chat-composer__attachment-trigger"
                type="button"
                aria-label="Open attachment options"
                aria-expanded={isAttachmentMenuOpen}
                onClick={() => setIsAttachmentMenuOpen((current) => !current)}
              >
                +
              </button>
              <label className="chat-composer__input-wrap">
                <span className="sr-only">Message coach</span>
                <textarea
                  aria-label="Message coach"
                  className="chat-composer__input"
                  value={conversationDraft}
                  onChange={(event) => setConversationDraft(event.target.value)}
                  placeholder="Tell the coach what grade you're in, what you're aiming for, what feels unclear, or say that you want to add a score, school list, or update."
                />
              </label>
              <div className="chat-composer__actions">
                <button
                  className="chat-composer__send"
                  type="button"
                  onClick={() => void handleConversationSubmit()}
                  disabled={isSendingConversation}
                >
                  {isSendingConversation ? "Sending..." : "Send"}
                </button>
              </div>
            </div>

            {materialComposerMode !== "closed" ? (
              <div className="chat-material-sheet">
                <div className="chat-material-sheet__header">
                  <strong>
                    {materialComposerMode === "upload"
                      ? "Share a file"
                      : "Paste something new"}
                  </strong>
                  <button type="button" onClick={closeMaterialComposer}>
                    Cancel
                  </button>
                </div>

                <div className="chat-material-sheet__grid">
                  <label>
                    <span>What is this?</span>
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
                    <span>Short label</span>
                    <input
                      aria-label="Title"
                      value={materialComposer.title}
                      onChange={(event) =>
                        updateMaterialComposer({
                          title: event.target.value,
                        })
                      }
                      placeholder="Give this a short name"
                    />
                  </label>
                </div>

                {materialComposerMode === "upload" ? (
                  <label className="chat-material-sheet__upload">
                    <span>Choose a file</span>
                    <input
                      aria-label="File upload"
                      type="file"
                      accept=".txt,.md,.csv,.json"
                      onChange={(event) => void handleFileUpload(event)}
                    />
                  </label>
                ) : null}

                <label className="chat-material-sheet__field">
                  <span>What do you want me to look at?</span>
                  <textarea
                    aria-label="Material content"
                    value={materialComposer.content}
                    onChange={(event) =>
                      updateMaterialComposer({
                        content: event.target.value,
                      })
                    }
                    placeholder="Paste a score, school list, activity, or family update."
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
                  {isApplyingMaterial ? "Adding..." : "Share with coach"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
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
