"use client";

import { useEffect, useRef, useState } from "react";

export function DemoAccessGate(props: { initialInviteToken?: string | null }) {
  const [accessCode, setAccessCode] = useState(props.initialInviteToken ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);

  const handleSubmit = async () => {
    const trimmed = accessCode.trim();

    if (trimmed.length === 0) {
      setError("Enter your pilot invite.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/session/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          inviteToken: trimmed,
        }),
      });

      if (!response.ok) {
        setError("That pilot invite was not recognized.");
        return;
      }

      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (hasAutoSubmitted.current || !props.initialInviteToken) {
      return;
    }

    hasAutoSubmitted.current = true;
    void handleSubmit();
  }, [props.initialInviteToken]);

  return (
    <main className="demo-access-page">
      <section className="demo-access-card">
        <div className="demo-access-card__eyebrow">Closed pilot access</div>
        <h1 className="demo-access-card__title">Open your active case.</h1>
        <p className="demo-access-card__body">
          Use your pilot invite and you will land directly inside the coach conversation for this case.
        </p>
        <p className="demo-access-card__aside">
          One active case. One coach thread. No dashboard tour.
        </p>

        <label className="demo-access-card__field">
          <span>Pilot invite</span>
          <input
            aria-label="Pilot invite"
            type="password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Paste your pilot invite"
          />
        </label>

        {error ? <div className="demo-access-card__error">{error}</div> : null}

        <button
          className="demo-access-card__submit"
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Opening..." : "Open the case"}
        </button>
      </section>
    </main>
  );
}
