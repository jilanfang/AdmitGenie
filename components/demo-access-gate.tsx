"use client";

import { useState } from "react";

export function DemoAccessGate() {
  const [accessCode, setAccessCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = accessCode.trim();

    if (trimmed.length === 0) {
      setError("Enter the demo access code.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/demo/access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          accessCode: trimmed,
        }),
      });

      if (!response.ok) {
        setError("The demo access code is not correct.");
        return;
      }

      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="demo-access-page">
      <section className="demo-access-card">
        <div className="demo-access-card__eyebrow">Private admissions coach</div>
        <h1 className="demo-access-card__title">Step into the conversation.</h1>
        <p className="demo-access-card__body">
          Enter the shared code and you will land directly inside the coach conversation. No setup, no dashboard tour.
        </p>
        <p className="demo-access-card__aside">
          One quiet thread. One coach. Start wherever the family actually is.
        </p>

        <label className="demo-access-card__field">
          <span>Shared access code</span>
          <input
            aria-label="Access code"
            type="password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Enter the shared code"
          />
        </label>

        {error ? <div className="demo-access-card__error">{error}</div> : null}

        <button
          className="demo-access-card__submit"
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entering..." : "Enter the coach"}
        </button>
      </section>
    </main>
  );
}
