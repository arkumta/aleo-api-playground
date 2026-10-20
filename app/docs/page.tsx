
"use client";

import { useState } from "react";

type Network = "mainnet" | "testnet";

const endpoints = [
  {
    method: "GET",
    path: "/latest/height",
    name: "Latest Block Height",
    description: "Returns the height of the latest block on the selected network.",
    input: "None",
    example: "20619105",
  },
  {
    method: "GET",
    path: "/latest/block",
    name: "Latest Block",
    description: "Retrieves information about the latest block.",
    input: "None",
    example: "{ /* latest block data */ }",
  },
  {
    method: "GET",
    path: "/block/{height}",
    name: "Block by Height",
    description: "Looks up a block using its numeric block height.",
    input: "Block height, e.g. 20619105",
    example: "{ /* block data */ }",
  },
  {
    method: "GET",
    path: "/transaction/{id}",
    name: "Transaction Lookup",
    description: "Looks up a transaction by its transaction ID.",
    input: "A valid transaction ID on the selected network",
    example: "{ /* transaction data */ }",
  },
  {
    method: "GET",
    path: "/program/{id}",
    name: "Program Source",
    description:
      "Retrieves the source code of a deployed Aleo program. For example, credits.aleo.",
    input: "A deployed program ID, e.g. credits.aleo",
    example: "program credits.aleo;",
  },
];

export default function DocsPage() {
  const [network, setNetwork] = useState<Network>("testnet");
  const [copied, setCopied] = useState("");

  const baseUrl =
    network === "mainnet"
      ? "https://api.explorer.provable.com/v1"
      : "https://api.explorer.provable.com/v1/testnet";

  const curlExample = `curl "${baseUrl}/latest/height"`;

  const javascriptExample = `const response = await fetch("${baseUrl}/latest/height");
const data = await response.json();

console.log(data);`;

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e0c] text-[#e7ebe7]">
      <header className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0b0e0c]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4f56a] text-xl font-black text-[#10150b]">
              A
            </div>
            <div>
              <div className="font-semibold">Aleo Playground</div>
              <div className="text-xs text-[#849087]">
                Developer documentation
              </div>
            </div>
          </a>

          <a
            href="/"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#c0c9c1] transition hover:border-[#c4f56a]/40 hover:text-[#c4f56a]"
          >
            ← API Playground
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[210px_minmax(0,1fr)] md:px-8 md:py-14">
        <aside className="hidden md:block">
          <div className="sticky top-28 space-y-2">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#68746b]">
              On this page
            </div>
            <a
              href="#getting-started"
              className="block rounded-lg bg-[#c4f56a]/[0.07] px-3 py-2 text-sm text-[#c4f56a]"
            >
              Getting started
            </a>
            <a
              href="#authentication"
              className="block rounded-lg px-3 py-2 text-sm text-[#98a39a] hover:text-white"
            >
              Authentication
            </a>
            <a
              href="#endpoints"
              className="block rounded-lg px-3 py-2 text-sm text-[#98a39a] hover:text-white"
            >
              API endpoints
            </a>
            <a
              href="#examples"
              className="block rounded-lg px-3 py-2 text-sm text-[#98a39a] hover:text-white"
            >
              Code examples
            </a>
            <a
              href="#errors"
              className="block rounded-lg px-3 py-2 text-sm text-[#98a39a] hover:text-white"
            >
              Error handling
            </a>
          </div>
        </aside>

        <article className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#c4f56a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c4f56a]" />
            ALEO API REFERENCE
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Build on Aleo<span className="text-[#c4f56a]">.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#9aa59c]">
            A beginner-friendly guide to exploring Aleo network data and
            retrieving block, transaction, and program information through
            the Explorer API.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-[#101511] p-4">
            <span className="text-sm text-[#8e998f]">Try examples on</span>
            <button
              onClick={() => setNetwork("mainnet")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                network === "mainnet"
                  ? "bg-[#c4f56a] text-[#10150b]"
                  : "border border-white/10 text-[#a7b1a8] hover:border-white/20"
              }`}
            >
              Mainnet
            </button>
            <button
              onClick={() => setNetwork("testnet")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                network === "testnet"
                  ? "bg-[#c4f56a] text-[#10150b]"
                  : "border border-white/10 text-[#a7b1a8] hover:border-white/20"
              }`}
            >
              Testnet
            </button>
            <span className="ml-auto text-xs text-[#c4f56a]">
              {network === "testnet" ? "Test network" : "Production network"}
            </span>
          </div>

          <section id="getting-started" className="scroll-mt-28 pt-12">
            <h2 className="text-2xl font-semibold">Getting started</h2>
            <p className="mt-3 leading-7 text-[#9aa59c]">
              The Explorer API lets your application request publicly
              available network information over HTTPS. Start with the latest
              block height before trying individual blocks, transactions, or
              deployed programs.
            </p>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#101511] p-5">
              <div className="mb-3 text-xs font-medium text-[#c4f56a]">
                BASE URL
              </div>
              <div className="break-all rounded-lg bg-[#090c0a] p-4 font-mono text-sm leading-6 text-[#c5d0c6]">
                {baseUrl}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#849087]">
                The base URL changes when you switch networks above. The
                examples on this page use the selected network.
              </p>
            </div>
          </section>

          <section id="authentication" className="scroll-mt-28 pt-12">
            <h2 className="text-2xl font-semibold">Authentication</h2>
            <p className="mt-3 leading-7 text-[#9aa59c]">
              The read-only GET examples in this playground do not require a
              wallet connection or a private key. They request public data
              from the configured Explorer API.
            </p>
            <div className="mt-4 rounded-xl border border-[#c4f56a]/15 bg-[#c4f56a]/[0.04] p-4 text-sm leading-6 text-[#aeb9af]">
              <span className="font-semibold text-[#c4f56a]">Security tip:</span>{" "}
              Never paste your wallet seed phrase or private key into an API
              request or this playground.
            </div>
          </section>

          <section id="endpoints" className="scroll-mt-28 pt-12">
            <h2 className="text-2xl font-semibold">API endpoints</h2>
            <p className="mt-3 leading-7 text-[#9aa59c]">
              These are the five GET endpoints currently available in the
              playground. Example response values are illustrative; actual
              responses depend on the endpoint and selected network.
            </p>

            <div className="mt-6 space-y-4">
              {endpoints.map((item) => (
                <div
                  key={item.path}
                  className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101511]"
                >
                  <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-4 md:px-5">
                    <span className="rounded-md bg-[#c4f56a]/10 px-2 py-1 text-[10px] font-bold text-[#c4f56a]">
                      {item.method}
                    </span>
                    <code className="break-all text-sm text-[#e1e9e2]">
                      {item.path}
                    </code>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#98a39a]">
                      {item.description}
                    </p>
                    <div className="mt-4 text-xs">
                      <span className="text-[#707d73]">Required input: </span>
                      <span className="text-[#c1cbc2]">{item.input}</span>
                    </div>
                    <div className="mt-4 rounded-lg bg-[#090c0a] p-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-[#6f7b71]">
                        Illustrative response
                      </div>
                      <code className="break-all text-xs leading-6 text-[#c4f56a]">
                        {item.example}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="examples" className="scroll-mt-28 pt-12">
            <h2 className="text-2xl font-semibold">Code examples</h2>
            <p className="mt-3 leading-7 text-[#9aa59c]">
              Use these examples to make your first request from a terminal
              or a JavaScript application.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101511]">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                <div>
                  <div className="text-sm font-medium">cURL</div>
                  <div className="mt-1 text-xs text-[#78847a]">
                    Run in your terminal
                  </div>
                </div>
                <button
                  onClick={() => void copyText(curlExample, "curl")}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b9c3ba] hover:border-[#c4f56a]/40 hover:text-[#c4f56a]"
                >
                  {copied === "curl" ? "Copied ✓" : "Copy command"}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all p-5 font-mono text-xs leading-6 text-[#c4f56a]">
                {curlExample}
              </pre>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101511]">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                <div>
                  <div className="text-sm font-medium">JavaScript</div>
                  <div className="mt-1 text-xs text-[#78847a]">
                    Fetch API example
                  </div>
                </div>
                <button
                  onClick={() => void copyText(javascriptExample, "js")}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b9c3ba] hover:border-[#c4f56a]/40 hover:text-[#c4f56a]"
                >
                  {copied === "js" ? "Copied ✓" : "Copy code"}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-6 text-[#c4f56a]">
                {javascriptExample}
              </pre>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#8e998f]">
              A successful request should return a response from the API.
              Check the HTTP status and the actual response body before using
              returned values in your application.
            </p>
          </section>

          <section id="errors" className="scroll-mt-28 pt-12">
            <h2 className="text-2xl font-semibold">Error handling</h2>
            <p className="mt-3 leading-7 text-[#9aa59c]">
              An API error can mean that the requested record was not found,
              the input was invalid, or the server could not process the
              request.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08]">
              <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-white/[0.07] bg-[#101511] px-4 py-3 text-xs font-medium text-[#7e8a80]">
                <span>HTTP status</span>
                <span>What to check</span>
              </div>
              <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-white/[0.07] px-4 py-4 text-sm">
                <code className="text-[#c4f56a]">200</code>
                <span className="leading-6 text-[#a3ada4]">
                  The request succeeded. Inspect the response body.
                </span>
              </div>
              <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-white/[0.07] px-4 py-4 text-sm">
                <code className="text-[#f4c66a]">400</code>
                <span className="leading-6 text-[#a3ada4]">
                  Check the input and the endpoint format.
                </span>
              </div>
              <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-white/[0.07] px-4 py-4 text-sm">
                <code className="text-[#f4c66a]">404</code>
                <span className="leading-6 text-[#a3ada4]">
                  The requested transaction, block, or program may not exist
                  on the selected network.
                </span>
              </div>
              <div className="grid grid-cols-[100px_minmax(0,1fr)] px-4 py-4 text-sm">
                <code className="text-red-300">5xx</code>
                <span className="leading-6 text-[#a3ada4]">
                  The server may be experiencing an issue. Check again later
                  and inspect the response message.
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#101511] p-4 text-sm leading-6 text-[#9aa59c]">
              <span className="font-semibold text-white">Important:</span>{" "}
              These are general troubleshooting guidelines, not a guarantee
              that every endpoint returns every status listed. Refer to the
              actual HTTP response for each request.
            </div>
          </section>

          <footer className="mt-14 border-t border-white/[0.08] pt-6 text-xs leading-6 text-[#707d73]">
            Aleo Playground is an independent developer tool. Verify endpoint
            behavior and response formats against the API provider's current
            documentation before relying on them in production.
            <div className="mt-3">
              <a href="/" className="text-[#c4f56a] hover:underline">
                Return to API Playground →
              </a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
