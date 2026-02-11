"use client";

import { useState } from "react";

export default function RefinePanel({
  projectId,
  disabled = false,
}: {
  projectId: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!text.trim()) return;

    setLoading(true);
    await fetch(`/api/projects/${projectId}/instructions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    setText("");
    setLoading(false);
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-2">Refine this app</h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={disabled || loading}
        placeholder="Add instructions like: Add auth, change layout, add Stripe later…"
        className="w-full rounded bg-secondary/40 p-2 text-sm resize-none disabled:opacity-50"
      />

      <button
        onClick={submit}
        disabled={disabled || loading}
        className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Applying…" : "Apply Changes"}
      </button>
    </div>
  );
}
