
"use client";

import { useMemo, useState } from "react";

type EndpointType =
  | "height"
  | "latest-block"
  | "block"
  | "transaction"
  | "program";

type ApiResult = {
  status: number;
  ok: boolean;
  data: unknown;
};

const endpointOptions: {
  id: EndpointType;
  method: string;
  path: string;
  title: string;
  description: string;
  needsInput: boolean;
  placeholder?: string;
}[] = [
  {
    id: "height",
    method: "GET",
    path: "/latest/height",
    title: "Latest Block Height",
    description: "Get the latest block height on the selected network.",
    needsInput: false,
  },
  {
    id: "latest-block",
    method: "GET",
    path: "/latest/block",
    title: "Latest Block",
    description: "Retrieve the latest block and its details.",
    needsInput: false,
  },
  {
    id: "block",
    method: "GET",
    path: "/block/{height}",
    title: "Block by Height",
    description: "Look up a block using its height.",
    needsInput: true,
    placeholder: "Enter a block height, e.g. 20619105",
  },
  {
    id: "transaction",
    method: "GET",
    path: "/transaction/{id}",
    title: "Transaction Lookup",
    description: "Look up a transaction by its transaction ID.",
    needsInput: true,
    placeholder: "Paste a transaction ID",
  },
  {
    id: "program",
    method: "GET",
    path: "/program/{id}",
    title: "Program Source",
    description: "Retrieve the source code for a deployed Aleo program.",
    needsInput: true,
    placeholder: "Enter a program ID, e.g. credits.aleo",
  },
];

function formatBytes(value: string) {
  const bytes = new TextEncoder().encode(value).length;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2) ?? String(value);
}

export default function Home() {
  const [network, setNetwork] = useState<"mainnet" | "testnet">("testnet");
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<EndpointType>("height");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [copied, setCopied] = useState(false);

  const endpoint = endpointOptions.find(
    (item) => item.id === selectedEndpoint
  )!;

  const requestPath = useMemo(() => {
    if (selectedEndpoint === "block") {
      return `/block/${encodeURIComponent(inputValue.trim())}`;
    }

    if (selectedEndpoint === "transaction") {
      return `/transaction/${encodeURIComponent(inputValue.trim())}`;
    }

    if (selectedEndpoint === "program") {
      return `/program/${encodeURIComponent(inputValue.trim())}`;
    }

    if (selectedEndpoint === "latest-block") {
      return "/latest/block";
    }

    return "/latest/height";
  }, [selectedEndpoint, inputValue]);

  const baseUrl =
    network === "mainnet"
      ? "https://api.explorer.provable.com/v1"
      : "https://api.explorer.provable.com/v1/testnet";

  const fullUrl = `${baseUrl}${requestPath}`;

  const isProgramSource =
    selectedEndpoint === "program" &&
    typeof result?.data === "string" &&
    result.data.trimStart().startsWith("program ");

  const responseText = result
    ? isProgramSource
      ? String(result.data)
      : formatJson(result.data)
    : "";

  const responseSize = responseText ? formatBytes(responseText) : "—";

  const responseSummary = !result
    ? "Waiting for a request"
    : !result.ok
      ? "The server returned an error"
      : isProgramSource
        ? "Leo program source received"
        : selectedEndpoint === "height"
          ? "Latest block height received"
          : selectedEndpoint === "latest-block" ||
              selectedEndpoint === "block"
            ? "Block data received"
            : selectedEndpoint === "transaction"
              ? "Transaction lookup completed"
              : "API response received";

  async function sendRequest() {
    if (endpoint.needsInput && !inputValue.trim()) {
      setRequestError(`Please enter ${selectedEndpoint === "block" ? "a block height" : selectedEndpoint === "transaction" ? "a transaction ID" : "a program ID"}.`);
      setResult(null);
      return;
    }

    setLoading(true);
    setRequestError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: { Accept: "application/json, text/plain, */*" },
      });

      const rawBody = await response.text();
      let data: unknown = rawBody;

      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        // Some endpoints, such as program source lookups, return plain text.
      }

      setResult({
        status: response.status,
        ok: response.ok,
        data,
      });
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "The request could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyResponse() {
    if (!responseText) return;

    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setRequestError("Could not copy the response. Please select and copy it manually.");
    }
  }

  function chooseEndpoint(id: EndpointType) {
    setSelectedEndpoint(id);
    setInputValue(id === "program" ? "credits.aleo" : "");
    setResult(null);
    setRequestError("");
    setCopied(false);
  }

  return (
    <main className="min-h-screen bg-[#0b0e0c] text-[#e7ebe7]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[245px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0e120f] p-5 md:flex">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4f56a] text-xl font-black text-[#10150b]">
              A
            </div>
            <div>
              <div className="font-semibold tracking-tight">Aleo Playground</div>
              <div className="mt-0.5 text-xs text-[#89938b]">
                Developer tools
              </div>
            </div>
          </div>

          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#667169]">
            Workspace
          </div>

          <a
            href="/"
            className="mb-2 flex items-center gap-3 rounded-xl border border-[#c4f56a]/20 bg-[#c4f56a]/10 px-3 py-3 text-left text-sm text-[#c4f56a] transition hover:bg-[#c4f56a]/15"
          >
            <span>⌘</span>
            API Playground
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c4f56a]" />
          </a>

          <a
            href="/explorer"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#a0aaa2] transition hover:bg-white/[0.04] hover:text-[#c4f56a]"
          >
            <span>◫</span> Network Explorer
            <span className="ml-auto text-[9px] uppercase text-[#c4f56a]">Open</span>
          </a>
          <a
            href="/leo-lab"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#a0aaa2] transition hover:bg-white/[0.04] hover:text-[#c4f56a]"
          >
            <span>⌘</span> Leo Lab
            <span className="ml-auto text-[9px] uppercase text-[#c4f56a]">Open</span>
          </a>
          <a
            href="/docs"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#a0aaa2] transition hover:bg-white/[0.04] hover:text-[#c4f56a]"
          >
            <span>▤</span> Documentation
            <span className="ml-auto text-[9px] uppercase text-[#c4f56a]">Open</span>
          </a>

          <div className="mt-auto rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#c4f56a]">
              <span className="h-2 w-2 rounded-full bg-[#c4f56a]" />
              API connection
            </div>
            <p className="text-xs leading-5 text-[#879188]">
              Requests are sent to the selected Aleo Explorer API network.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 md:px-9">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c4f56a] font-black text-[#10150b]">
                A
              </div>
              <span className="font-semibold">Aleo Playground</span>
            </div>

            <div className="hidden text-sm text-[#8c968e] md:block">
              Developer Workspace <span className="mx-2 text-[#3e4840]">/</span>
              <span className="text-[#e7ebe7]">API Playground</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#89938b]">Network</span>
              <div className="flex rounded-lg border border-white/[0.1] bg-[#121713] p-1">
                <button
                  onClick={() => {
                    setNetwork("mainnet");
                    setResult(null);
                    setRequestError("");
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    network === "mainnet"
                      ? "bg-[#c4f56a] text-[#10150b]"
                      : "text-[#a0aaa2] hover:text-white"
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => {
                    setNetwork("testnet");
                    setResult(null);
                    setRequestError("");
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    network === "testnet"
                      ? "bg-[#c4f56a] text-[#10150b]"
                      : "text-[#a0aaa2] hover:text-white"
                  }`}
                >
                  Testnet
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] p-5 md:p-9">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#c4f56a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c4f56a]" />
                ALEO DEVELOPER TOOLS
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                API Playground<span className="text-[#c4f56a]">.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#909b92] md:text-base">
                Explore Aleo network data, inspect deployed programs, and test
                API requests in one place.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
              <div className="rounded-2xl border border-white/[0.09] bg-[#101511] p-5 md:p-6">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Request builder</h2>
                    <p className="mt-1 text-xs leading-5 text-[#849087]">
                      Choose an endpoint and send a GET request.
                    </p>
                  </div>
                  <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-[#9ca69e]">
                    REST API
                  </span>
                </div>

                <label className="mb-2 block text-xs font-medium text-[#b8c1ba]">
                  Endpoint
                </label>
                <div className="space-y-2">
                  {endpointOptions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => chooseEndpoint(item.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selectedEndpoint === item.id
                          ? "border-[#c4f56a]/35 bg-[#c4f56a]/[0.06]"
                          : "border-white/[0.07] bg-[#0c100d] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#c4f56a]/10 px-1.5 py-1 text-[9px] font-bold text-[#c4f56a]">
                          {item.method}
                        </span>
                        <span className="text-sm font-medium">{item.title}</span>
                        {selectedEndpoint === item.id && (
                          <span className="ml-auto text-[#c4f56a]">✓</span>
                        )}
                      </div>
                      <div className="mt-2 font-mono text-xs text-[#a0aaa2]">
                        {item.path}
                      </div>
                      {selectedEndpoint === item.id && (
                        <p className="mt-2 text-xs leading-5 text-[#7f8a81]">
                          {item.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                {endpoint.needsInput && (
                  <div className="mt-5">
                    <label
                      htmlFor="endpoint-input"
                      className="mb-2 block text-xs font-medium text-[#b8c1ba]"
                    >
                      {selectedEndpoint === "block"
                        ? "Block height"
                        : selectedEndpoint === "transaction"
                          ? "Transaction ID"
                          : "Program ID"}
                    </label>
                    <input
                      id="endpoint-input"
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void sendRequest();
                      }}
                      placeholder={endpoint.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-[#0b0e0c] px-4 py-3 font-mono text-sm outline-none placeholder:text-[#4e5a51] focus:border-[#c4f56a]/50"
                    />
                  </div>
                )}

                <div className="mt-5">
                  <div className="mb-2 text-xs font-medium text-[#b8c1ba]">
                    Request URL
                  </div>
                  <div className="break-all rounded-xl border border-white/[0.07] bg-[#0b0e0c] p-3 font-mono text-[11px] leading-5 text-[#8d998f]">
                    <span className="text-[#c4f56a]">GET </span>
                    {fullUrl}
                  </div>
                </div>

                {requestError && (
                  <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300">
                    {requestError}
                  </div>
                )}

                <button
                  onClick={() => void sendRequest()}
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c4f56a] px-4 py-3.5 text-sm font-bold text-[#10150b] transition hover:bg-[#d5ff8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#10150b]/30 border-t-[#10150b]" />
                      Sending request...
                    </>
                  ) : (
                    <>
                      Send request <span aria-hidden="true">↗</span>
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-[11px] leading-5 text-[#657168]">
                  GET requests only · No wallet connection required
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/[0.09] bg-[#101511]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 md:px-6">
                  <div>
                    <h2 className="font-semibold">Response</h2>
                    <p className="mt-1 text-xs text-[#849087]">
                      API output and request status
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
                        {result.status} {result.ok ? "OK" : "Error"}
                      </span>
                    )}
                    <button
                      onClick={() => void copyResponse()}
                      disabled={!result}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#c0c9c1] transition hover:border-[#c4f56a]/30 hover:text-[#c4f56a] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copied ? "Copied ✓" : "Copy response"}
                    </button>
                  </div>
                </div>

                {result ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 border-b border-white/[0.08] p-4 md:grid-cols-3 md:p-5">
                      <div className="rounded-xl border border-white/[0.06] bg-[#0b0e0c] p-3">
                        <div className="text-[10px] uppercase tracking-wider text-[#758077]">
                          Status
                        </div>
                        <div
                          className={`mt-2 text-lg font-semibold ${
                            result.ok ? "text-[#c4f56a]" : "text-red-300"
                          }`}
                        >
                          {result.status}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#0b0e0c] p-3">
                        <div className="text-[10px] uppercase tracking-wider text-[#758077]">
                          Response size
                        </div>
                        <div className="mt-2 text-lg font-semibold">
                          {responseSize}
                        </div>
                      </div>
                      <div className="col-span-2 rounded-xl border border-white/[0.06] bg-[#0b0e0c] p-3 md:col-span-1">
                        <div className="text-[10px] uppercase tracking-wider text-[#758077]">
                          Content type
                        </div>
                        <div className="mt-2 truncate text-sm font-semibold">
                          {isProgramSource ? "Leo source" : "JSON / data"}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-xs text-[#8b968d] md:col-span-3">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            result.ok ? "bg-[#c4f56a]" : "bg-red-400"
                          }`}
                        />
                        {responseSummary}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                        <div className="text-xs font-medium text-[#aeb8b0]">
                          {isProgramSource ? "Program source" : "Response body"}
                        </div>
                        <div className="font-mono text-[10px] text-[#657168]">
                          {isProgramSource ? "LEO" : "JSON"}
                        </div>
                      </div>
                      {isProgramSource && (
                        <div className="border-b border-white/[0.06] bg-[#c4f56a]/[0.035] px-5 py-3 text-xs leading-5 text-[#a5b1a6]">
                          <span className="font-semibold text-[#c4f56a]">
                            Program source loaded.
                          </span>{" "}
                          The content below is the returned Leo source code.
                          Use Copy response to copy it.
                        </div>
                      )}
                      <pre className="max-h-[650px] min-h-[300px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-6 text-[#b8c5b9] md:text-[13px]">
                        <code>{responseText}</code>
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[430px] flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] text-2xl text-[#c4f56a]">
                      {"{ }"}
                    </div>
                    <h3 className="font-medium text-[#dce4dd]">
                      Your response will appear here
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#7e8980]">
                      Select an endpoint, choose your network, and send a
                      request to inspect the returned Aleo data.
                    </p>
                    <div className="mt-6 rounded-lg border border-white/[0.07] bg-[#0b0e0c] px-4 py-2 font-mono text-xs text-[#89958b]">
                      GET /latest/height
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 text-[11px] text-[#69756c]">
              <span>Built for the Aleo developer ecosystem</span>
              <span>API Playground · Early version</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
