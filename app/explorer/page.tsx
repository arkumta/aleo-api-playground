
"use client";

import { useState } from "react";

type Network = "mainnet" | "testnet";
type SearchType = "height" | "block" | "transaction" | "program";

type ApiResult = {
  status: number;
  ok: boolean;
  data: unknown;
};

const searches: {
  id: SearchType;
  title: string;
  description: string;
  placeholder: string;
  path: string;
}[] = [
  {
    id: "height",
    title: "Latest Height",
    description: "Get the current block height.",
    placeholder: "",
    path: "/latest/height",
  },
  {
    id: "block",
    title: "Block Lookup",
    description: "Find a block by its height.",
    placeholder: "Enter block height",
    path: "/block/",
  },
  {
    id: "transaction",
    title: "Transaction Lookup",
    description: "Find a transaction by its ID.",
    placeholder: "Paste transaction ID",
    path: "/transaction/",
  },
  {
    id: "program",
    title: "Program Lookup",
    description: "Retrieve a deployed program's source.",
    placeholder: "e.g. credits.aleo",
    path: "/program/",
  },
];

function displayData(data: unknown) {
  return typeof data === "string"
    ? data
    : JSON.stringify(data, null, 2) ?? String(data);
}

export default function ExplorerPage() {
  const [network, setNetwork] = useState<Network>("testnet");
  const [searchType, setSearchType] = useState<SearchType>("height");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const selected = searches.find((item) => item.id === searchType)!;

  const baseUrl =
    network === "mainnet"
      ? "https://api.explorer.provable.com/v1"
      : "https://api.explorer.provable.com/v1/testnet";

  const requestPath =
    selected.path +
    (searchType === "height" ? "" : encodeURIComponent(query.trim()));

  const requestUrl = baseUrl + requestPath;

  const responseText = result ? displayData(result.data) : "";

  const isProgramSource =
    searchType === "program" &&
    typeof result?.data === "string" &&
    result.data.trimStart().startsWith("program ");

  async function search() {
    if (searchType !== "height" && !query.trim()) {
      setError("Please enter a value before searching.");
      setResult(null);
      return;
    }

    if (searchType === "block" && !/^\d+$/.test(query.trim())) {
      setError("Block height must contain digits only.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: { Accept: "application/json, text/plain, */*" },
      });

      const text = await response.text();
      let data: unknown = text;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // Some API responses, including program source, are plain text.
      }

      setResult({
        status: response.status,
        ok: response.ok,
        data,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}. Check your internet connection and try again.`
          : "The request could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!responseText) return;

    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed. Please select and copy the response manually.");
    }
  }

  function changeNetwork(next: Network) {
    setNetwork(next);
    setResult(null);
    setError("");
  }

  function changeSearch(next: SearchType) {
    setSearchType(next);
    setQuery("");
    setResult(null);
    setError("");
    setCopied(false);
  }

  return (
    <main className="min-h-screen bg-[#0b0e0c] text-[#e7ebe7]">
      <header className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0b0e0c]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4f56a] text-xl font-black text-[#10150b]">
              A
            </div>
            <div>
              <div className="font-semibold">Aleo Playground</div>
              <div className="text-xs text-[#89938b]">Network Explorer</div>
            </div>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => changeNetwork("mainnet")}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                network === "mainnet"
                  ? "bg-[#c4f56a] text-[#10150b]"
                  : "border border-white/10 text-[#a0aaa2]"
              }`}
            >
              Mainnet
            </button>
            <button
              onClick={() => changeNetwork("testnet")}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                network === "testnet"
                  ? "bg-[#c4f56a] text-[#10150b]"
                  : "border border-white/10 text-[#a0aaa2]"
              }`}
            >
              Testnet
            </button>
            <a
              href="/docs"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b9c3ba] hover:text-[#c4f56a]"
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#c4f56a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c4f56a]" />
            ALEO NETWORK DATA
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Network Explorer<span className="text-[#c4f56a]">.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#909b92] md:text-base">
            Explore blocks, look up transactions, and inspect deployed Aleo
            programs. Select a network and query the Explorer API directly.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {searches.map((item) => (
            <button
              key={item.id}
              onClick={() => changeSearch(item.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                searchType === item.id
                  ? "border-[#c4f56a]/35 bg-[#c4f56a]/[0.06]"
                  : "border-white/[0.08] bg-[#101511] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{item.title}</span>
                {searchType === item.id && (
                  <span className="text-[#c4f56a]">✓</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#859087]">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <section className="rounded-2xl border border-white/[0.09] bg-[#101511] p-5 md:p-6">
            <h2 className="text-lg font-semibold">Search network data</h2>
            <p className="mt-2 text-sm leading-6 text-[#849087]">
              {selected.description}
            </p>

            {searchType !== "height" && (
              <div className="mt-6">
                <label
                  htmlFor="explorer-query"
                  className="mb-2 block text-xs font-medium text-[#b8c1ba]"
                >
                  {searchType === "block"
                    ? "Block height"
                    : searchType === "transaction"
                      ? "Transaction ID"
                      : "Program ID"}
                </label>
                <input
                  id="explorer-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void search();
                  }}
                  placeholder={selected.placeholder}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e0c] px-4 py-3 font-mono text-sm outline-none placeholder:text-[#4e5a51] focus:border-[#c4f56a]/50"
                />
              </div>
            )}

            <div className="mt-6">
              <div className="mb-2 text-xs font-medium text-[#b8c1ba]">
                Request URL
              </div>
              <div className="break-all rounded-xl border border-white/[0.07] bg-[#0b0e0c] p-3 font-mono text-xs leading-6 text-[#a0aaa2]">
                <span className="text-[#c4f56a]">GET </span>
                {requestUrl}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={() => void search()}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c4f56a] px-4 py-3.5 text-sm font-bold text-[#10150b] transition hover:bg-[#d5ff8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search Aleo ↗"}
            </button>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b0e0c] p-4">
              <div className="text-xs font-semibold text-[#c4f56a]">
                Quick tip
              </div>
              <p className="mt-2 text-xs leading-5 text-[#849087]">
                Start with Latest Height to confirm the selected network is
                responding. For a program lookup, try credits.aleo.
              </p>
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101511]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
              <div>
                <h2 className="font-semibold">Search result</h2>
                <p className="mt-1 text-xs text-[#849087]">
                  Live API response
                </p>
              </div>
              <div className="flex items-center gap-2">
                {result && (
                  <span
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      result.ok
                        ? "border-[#c4f56a]/20 bg-[#c4f56a]/[0.07] text-[#c4f56a]"
                        : "border-red-400/20 bg-red-400/[0.07] text-red-300"
                    }`}
                  >
                    HTTP {result.status}
                  </span>
                )}
                <button
                  onClick={() => void copyResult()}
                  disabled={!result}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#c0c9c1] hover:border-[#c4f56a]/30 hover:text-[#c4f56a] disabled:opacity-40"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            {result ? (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] px-5 py-3 text-xs text-[#8c988e]">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      result.ok ? "bg-[#c4f56a]" : "bg-red-400"
                    }`}
                  />
                  {result.ok ? "Request completed" : "Request returned an error"}
                  <span className="ml-auto">
                    {isProgramSource ? "Leo source" : "Response data"}
                  </span>
                </div>
                {isProgramSource && (
                  <div className="border-b border-white/[0.07] bg-[#c4f56a]/[0.04] px-5 py-3 text-xs text-[#aab6ab]">
                    Deployed program source received.
                  </div>
                )}
                <pre className="max-h-[700px] min-h-[360px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-6 text-[#bdc9be] md:text-[13px]">
                  <code>{responseText}</code>
                </pre>
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] font-mono text-xl text-[#c4f56a]">
                  {"{ }"}
                </div>
                <h3 className="font-medium">Ready to explore</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#7e8980]">
                  Select a search type and click Search Aleo. Your response
                  will appear here.
                </p>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 text-[11px] text-[#69756c]">
          <a href="/" className="hover:text-[#c4f56a]">
            ← Back to API Playground
          </a>
          <span>Network Explorer · Early version</span>
        </footer>
      </div>
    </main>
  );
}
