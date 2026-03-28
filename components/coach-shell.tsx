"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import type { MaterialDraft, MaterialType } from "@/lib/domain/demo-state";
import type { CaseReadinessStatus, CoachSnapshot } from "@/lib/server/persistence";

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

type CaseStatePayload = {
  data?: {
    state: CoachSnapshot;
    readiness?: CaseReadinessStatus;
  };
  error?: string;
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
  const [readiness, setReadiness] = useState<CaseReadinessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingMaterial, setIsApplyingMaterial] = useState(false);
  const [isSendingConversation, setIsSendingConversation] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isCasePanelOpen, setIsCasePanelOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [conversationDraft, setConversationDraft] = useState("");
  const [materialComposerMode, setMaterialComposerMode] =
    useState<MaterialComposerMode>("closed");
  const [materialComposer, setMaterialComposer] =
    useState<MaterialComposerState>(DEFAULT_COMPOSER_STATE);
  const [decisionSelection, setDecisionSelection] = useState<string[]>([]);
  const [uiError, setUiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      try {
        const payload = await fetchCaseState();

        if (!active) {
          return;
        }

        setState(payload.data?.state ?? null);
        setReadiness(payload.data?.readiness ?? null);
        setDecisionSelection([]);
        setUiError(null);
      } catch {
        if (!active) {
          return;
        }

        setUiError("We could not load this case right now.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1100px)");
    const syncLayoutMode = () => {
      setIsDesktopLayout(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsCasePanelOpen(false);
      }
    };

    syncLayoutMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncLayoutMode);
      return () => mediaQuery.removeEventListener("change", syncLayoutMode);
    }

    mediaQuery.addListener(syncLayoutMode);
    return () => mediaQuery.removeListener(syncLayoutMode);
  }, []);

  const sendConversation = async (message: string) => {
    setIsSendingConversation(true);
    setUiError(null);

    try {
      const response = await fetch("/api/case/conversation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: {
          state: CoachSnapshot;
        };
      };

      if (!response.ok) {
        handleCaseRouteFailure(response.status, payload.error);
        return;
      }

      setState(payload.data?.state ?? null);
      setIsBriefOpen(false);
      setConversationDraft("");
      setDecisionSelection([]);
      setIsAttachmentMenuOpen(false);
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : "We could not send that message right now. Please try again.",
      );
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
        error: "Add both a short label and the material content before sharing it.",
      });
      return;
    }

    setIsApplyingMaterial(true);
    setUiError(null);

    try {
      const response = await fetch("/api/case/materials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draft: {
            type: materialComposer.type,
            title,
            content,
          },
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: {
          state: CoachSnapshot;
        };
      };

      if (!response.ok) {
        handleCaseRouteFailure(response.status, payload.error);
        return;
      }

      setState(payload.data?.state ?? null);
      setIsBriefOpen(false);
      closeMaterialComposer();
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : "We could not process that material right now. Please try again.",
      );
    } finally {
      setIsApplyingMaterial(false);
    }
  };

  if (isLoading || !state) {
    return (
      <main className="coach-shell-page">
        <div className="coach-shell-loading">Opening your case...</div>
      </main>
    );
  }

  const latestMaterialAnalysis = state.materialAnalysis[0] ?? null;
  const latestPatch = state.patches[0] ?? null;
  const latestDecisionCard = state.decisionCard;
  const suggestedReplies = state.suggestedReplies;
  const isCasePanelVisible = isDesktopLayout || isCasePanelOpen;
  const isStarterStage =
    state.conversation.length <= 2 &&
    suggestedReplies.length > 0 &&
    latestMaterialAnalysis === null &&
    latestDecisionCard === null;
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

  return (
    <main className="coach-shell-page">
      <div className={`chat-shell${isDesktopLayout ? " chat-shell--desktop" : ""}`}>
        {!isDesktopLayout ? (
          <button
            className="chat-shell__panel-toggle"
            type="button"
            aria-expanded={isCasePanelOpen}
            aria-label="Open case details"
            onClick={() => setIsCasePanelOpen((current) => !current)}
          >
            Case
          </button>
        ) : null}

        {isCasePanelVisible ? (
          <>
            {!isDesktopLayout ? (
              <button
                className="chat-shell__panel-scrim"
                type="button"
                aria-label="Close case details"
                onClick={() => setIsCasePanelOpen(false)}
              />
            ) : null}
            <aside className={`chat-side-panel${isDesktopLayout ? " chat-side-panel--docked" : ""}`}>
              <div className="chat-side-panel__header">
                <strong>{state.caseRecord.displayName}</strong>
                {!isDesktopLayout ? (
                  <button
                    type="button"
                    aria-label="Close case details"
                    onClick={() => setIsCasePanelOpen(false)}
                  >
                    Close
                  </button>
                ) : null}
              </div>

              <label className="chat-side-panel__field">
                <span>Active case</span>
                <div className="chat-side-panel__value">
                  <strong>{state.studentProfile.gradeLevel}</strong>
                  <small>{state.studentProfile.majorDirection ?? "North America admissions planning"}</small>
                </div>
              </label>

              <div className="chat-side-panel__note">
                <strong>Case summary</strong>
                <p>{state.caseRecord.summary}</p>
              </div>

              <div className="chat-side-panel__note">
                <strong>Latest status</strong>
                <p>{state.caseRecord.latestStatus}</p>
              </div>

              <div className="chat-side-panel__note">
                <strong>One next move</strong>
                <p>{state.caseRecord.oneNextMove}</p>
              </div>

              <div className="chat-side-panel__meta">
                <span>{state.studentProfile.firstName ?? state.caseRecord.displayName}</span>
                {readiness?.blocker ? <small>{readiness.blocker}</small> : null}
              </div>
            </aside>
          </>
        ) : null}

        <section
          className={`chat-main chat-main--single-column${isDesktopLayout ? " chat-main--with-rail" : ""}${isStarterStage ? " chat-main--starter" : ""}`}
        >
          <header className="sr-only">
            <h1>Let&apos;s figure out the next best step.</h1>
            <p>
              Tell me what grade you&apos;re in, what you&apos;re aiming for, or what feels most unclear.
              If you already have a score report, school list, or update, drop it here and I&apos;ll help you turn it into a plan.
            </p>
          </header>

          {isStarterStage ? (
            <div className="chat-main__starter-heading" aria-hidden="true">
              <h2>Where should we start?</h2>
              <p>
                Tell me what feels unclear, or drop in a score, school list, or family update.
              </p>
            </div>
          ) : null}

          <div className={`chat-main__stream${isStarterStage ? " chat-main__stream--starter" : ""}`}>
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

            {latestMaterialAnalysis && latestPatch ? (
              <article className="chat-bubble chat-bubble--coach chat-bubble--insert">
                <div className="chat-bubble__label">{describeMaterialOutcome(latestMaterialAnalysis.patchStatus)}</div>
                <p>{latestPatch.summary}</p>
                <p className="chat-bubble__meta">
                  {latestMaterialAnalysis.profileImpact}
                </p>
                {latestMaterialAnalysis.extractedFacts.length > 0 ? (
                  <p className="chat-bubble__meta">
                    Source signals: {latestMaterialAnalysis.extractedFacts.join(" · ")}
                  </p>
                ) : null}
                <button
                  className="chat-composer__send"
                  type="button"
                  onClick={() => setIsBriefOpen((current) => !current)}
                >
                  {isBriefOpen ? "Hide the extra detail" : "See why I am taking this angle"}
                </button>
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
                  <strong>What I&apos;d do next:</strong> {state.weeklyBrief.topActions.join(" ")}
                </p>
                <p>
                  <strong>What I want us to watch:</strong> {state.weeklyBrief.risks.join(" ")}
                </p>
                <p>
                  <strong>Why I&apos;m taking this angle:</strong> {state.weeklyBrief.whyThisAdvice}
                </p>
              </article>
            ) : null}

            {uiError ? (
              <article className="chat-bubble chat-bubble--coach chat-bubble--insert">
                <div className="chat-bubble__label">Heads up</div>
                <p>{uiError}</p>
              </article>
            ) : null}
          </div>

          <div className={`chat-composer${isStarterStage ? " chat-composer--starter" : ""}`}>
            {isAttachmentMenuOpen ? (
              <div className="chat-composer__attachment-menu">
                <button
                  className="chat-button chat-button--secondary"
                  type="button"
                  onClick={() => openMaterialComposer("upload")}
                >
                  Upload a file
                </button>
                <button
                  className="chat-button chat-button--secondary"
                  type="button"
                  onClick={() => openMaterialComposer("paste")}
                >
                  Paste an update
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
                  placeholder="Tell the coach what feels unclear, what changed, or what you want to decide next."
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
                      ? "Share a document or note"
                      : "Paste a new update"}
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
                    <span>Choose a plain-text file</span>
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
                    placeholder="Paste a score report, school list, activity update, or family note."
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
                  {isApplyingMaterial ? "Sharing..." : "Share with coach"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

async function fetchCaseState(): Promise<CaseStatePayload> {
  const response = await fetch("/api/case/state");

  if (response.status === 401) {
    window.location.reload();
    return {};
  }

  return (await response.json()) as CaseStatePayload;
}

function handleCaseRouteFailure(status: number, error?: string) {
  if (status === 401) {
    window.location.reload();
    return;
  }

  throw new Error(error ?? "Case request failed.");
}

function formatConversationMessage(message: string) {
  if (message.startsWith("Family: ")) {
    return message.replace(/^Family:\s*/, "");
  }

  if (message.startsWith("Coach: ")) {
    return message.replace(/^Coach:\s*/, "");
  }

  return message;
}

function describeMaterialOutcome(
  patchStatus: CoachSnapshot["materialAnalysis"][number]["patchStatus"],
) {
  if (patchStatus === "needs_confirmation") {
    return "Decision needed";
  }

  if (patchStatus === "conflict") {
    return "Conflict detected";
  }

  return "Saved and summarized";
}
