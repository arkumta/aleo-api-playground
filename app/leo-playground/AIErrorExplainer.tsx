
"use client";

import { useState } from "react";

type Props = {
  code: string;
  compilerOutput: string;
  diagnostics: unknown[];
};

export default function AIErrorExplainer({
  code,
  compilerOutput,
  diagnostics,
}: Props) {
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function explainError() {
    setLoading(true);
    setError("");
    setExplanation("");

    try {
      const response = await fetch("/api/leo-explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          compilerOutput,
          diagnostics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to explain this error.");
      }

      setExplanation(data.explanation || "No explanation was returned.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="my-4 rounded-xl border border-lime-500/30 bg-zinc-900 p-4 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lime-400">
            AI Error Explainer
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Understand the compiler error and how to fix it.
          </p>
        </div>

        <button
          type="button"
          onClick={explainError}
          disabled={loading || !code.trim()}
          className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Explain error with AI"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <p className="mt-4 text-sm text-zinc-400">
          Reading the Leo code and compiler diagnostics...
        </p>
      )}

      {explanation && (
        <div className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm leading-7">
          {explanation}
        </div>
      )}
    </section>
  );
}
