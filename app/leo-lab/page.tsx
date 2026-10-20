"use client";

import { useMemo, useState } from "react";

type Example = {
  id: string;
  title: string;
  category: string;
  level: string;
  summary: string;
  explanation: string[];
  code: string;
  note: string;
};

const examples: Example[] = [
  {
    id: "hello",
    title: "Hello, Leo",
    category: "Basics",
    level: "Beginner",
    summary: "Understand the basic shape of a Leo program.",
    explanation: [
      "A Leo source file commonly begins with a program declaration that names the program.",
      "A transition is an entry point that can be called as part of a program execution.",
      "This is a teaching example. Check the syntax against the Leo version installed in your local development environment before compiling.",
    ],
    code: `program hello_aleo.aleo;

function main:
    input r0 as u32.public;
    let r1: u32 = r0 + 1u32;
    output r1 as u32.public;`,
    note: "Illustrative starter example. Compile with your installed Leo toolchain to verify syntax and compatibility.",
  },
  {
    id: "types",
    title: "Data types",
    category: "Basics",
    level: "Beginner",
    summary: "See how a simple numeric value is passed to a function.",
    explanation: [
      "Leo uses explicit types, such as u32, for unsigned 32-bit integers.",
      "The input declaration describes the type and visibility of the value passed into this transition.",
      "The example returns a numeric result. It is intentionally small so you can focus on types and arithmetic.",
    ],
    code: `program types_demo.aleo;

function double_value:
    input r0 as u32.public;
    let r1: u32 = r0 * 2u32;
    output r1 as u32.public;`,
    note: "Illustrative example. Confirm literal and function syntax with the Leo version you use.",
  },
  {
    id: "mapping",
    title: "Mappings",
    category: "State",
    level: "Intermediate",
    summary: "Learn the role of mappings in storing program state.",
    explanation: [
      "A mapping represents key-value state associated with a program.",
      "Mappings are commonly used for registries, counters, and simple on-chain state.",
      "This snippet shows a mapping declaration only; it is not a complete runnable program and does not implement reads or writes.",
    ],
    code: `program registry_demo.aleo;

mapping scores: address => u64;`,
    note: "Declaration-only example. Add and test transition logic before using a mapping in an application.",
  },
  {
    id: "records",
    title: "Records concept",
    category: "Privacy",
    level: "Intermediate",
    summary: "Explore the idea of record-based data in Aleo applications.",
    explanation: [
      "Records are a key Aleo concept for representing data with ownership and privacy properties.",
      "Record syntax and rules are specific to Leo and can vary with language versions.",
      "This card is a conceptual guide rather than a complete record implementation, so no code is supplied as production-ready syntax.",
    ],
    code: `// Conceptual example — not compilable Leo code
//
// A record may represent an owned asset.
// Its fields and visibility rules must follow
// the Leo version and application design.
//
// Start with the official Leo documentation
// before implementing a record.`,
    note: "Conceptual placeholder, intentionally not presented as compilable code.",
  },
  {
    id: "function",
    title: "Function structure",
    category: "Basics",
    level: "Beginner",
    summary: "Recognize the parts of a simple Leo transition.",
    explanation: [
      "The program declaration names the program.",
      "The function declares an input, computes a value, and returns an output.",
      "Try changing the input type or arithmetic operation, then compile locally to check the result.",
    ],
    code: `program math_demo.aleo;

function add_one:
    input r0 as u32.public;
    let r1: u32 = r0 + 1u32;
    output r1 as u32.public;`,
    note: "Educational example; verify it with the Leo compiler version you have installed.",
  },
];

const categories = ["All", "Basics", "State", "Privacy"];

export default function LeoLabPage() {
  const [selectedId, setSelectedId] = useState("hello");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredExamples = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return examples.filter((example) => {
      const matchesCategory =
        category === "All" || example.category === category;
      const matchesSearch =
        !normalized ||
        `${example.title} ${example.summary} ${example.category}`
          .toLowerCase()
          .includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const selected =
    filteredExamples.find((example) => example.id === selectedId) ??
    filteredExamples[0] ??
    null;

  async function copyCode() {
    if (!selected) return;

    try {
      await navigator.clipboard.writeText(selected.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function chooseCategory(nextCategory: string) {
    setCategory(nextCategory);
    setCopied(false);
  }

  function chooseExample(id: string) {
    setSelectedId(id);
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
              <div className="text-xs text-[#89938b]">Leo Lab</div>
            </div>
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/explorer"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b9c3ba] hover:text-[#c4f56a]"
            >
              Network Explorer
            </a>
            <a
              href="/docs"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b9c3ba] hover:text-[#c4f56a]"
            >
              API Docs
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#c4f56a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c4f56a]" />
            LEARN LEO
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Leo Lab<span className="text-[#c4f56a]">.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#909b92] md:text-base">
            Learn Leo concepts through small examples. Browse snippets, read
            explanations, and copy code to experiment with your local Leo
            development environment.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { value: "5", label: "Learning examples" },
            { value: "3", label: "Topic categories" },
            { value: "Local", label: "Compile environment" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.08] bg-[#101511] p-4"
            >
              <div className="text-xl font-semibold text-[#c4f56a]">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-[#849087]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(270px,0.78fr)_minmax(0,1.22fr)]">
          <section className="rounded-2xl border border-white/[0.09] bg-[#101511] p-4 md:p-5">
            <div className="mb-4">
              <h2 className="font-semibold">Example library</h2>
              <p className="mt-1 text-xs leading-5 text-[#849087]">
                Choose a topic to explore.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search examples..."
              aria-label="Search examples"
              className="mb-4 w-full rounded-xl border border-white/10 bg-[#0b0e0c] px-3 py-3 text-sm outline-none placeholder:text-[#4e5a51] focus:border-[#c4f56a]/50"
            />

            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => chooseCategory(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    category === item
                      ? "bg-[#c4f56a] text-[#10150b]"
                      : "border border-white/10 text-[#9aa59c] hover:border-white/20"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredExamples.map((example) => (
                <button
                  key={example.id}
                  onClick={() => chooseExample(example.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected?.id === example.id
                      ? "border-[#c4f56a]/35 bg-[#c4f56a]/[0.06]"
                      : "border-white/[0.07] bg-[#0b0e0c] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{example.title}</span>
                    {selected?.id === example.id && (
                      <span className="text-[#c4f56a]">✓</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#849087]">
                    {example.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-[#89958b]">
                      {example.category}
                    </span>
                    <span className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-[#89958b]">
                      {example.level}
                    </span>
                  </div>
                </button>
              ))}
              {filteredExamples.length === 0 && (
                <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-[#849087]">
                  No examples match that search. Try another keyword or
                  category.
                </p>
              )}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101511]">
            {selected ? (
              <>
                <div className="border-b border-white/[0.08] p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-md bg-[#c4f56a]/10 px-2 py-1 text-[10px] font-semibold text-[#c4f56a]">
                          {selected.category}
                        </span>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-[#9aa59c]">
                          {selected.level}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold">
                        {selected.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#9aa59c]">
                        {selected.summary}
                      </p>
                    </div>
                    <button
                      onClick={() => void copyCode()}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#c0c9c1] transition hover:border-[#c4f56a]/30 hover:text-[#c4f56a]"
                    >
                      {copied ? "Copied ✓" : "Copy code"}
                    </button>
                  </div>
                </div>

                <div className="border-b border-white/[0.07] bg-[#090c0a]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                    <span className="text-xs font-medium text-[#aeb8b0]">
                      Leo source
                    </span>
                    <span className="font-mono text-[10px] text-[#657168]">
                      .leo
                    </span>
                  </div>
                  <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-6 text-[#c4f56a] md:text-[13px]">
                    <code>{selected.code}</code>
                  </pre>
                </div>

                <div className="p-5 md:p-6">
                  <h3 className="font-semibold">How it works</h3>
                  <ol className="mt-4 space-y-3">
                    {selected.explanation.map((line, index) => (
                      <li
                        key={`${selected.id}-${index}`}
                        className="flex gap-3 text-sm leading-6 text-[#a3ada4]"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c4f56a]/20 bg-[#c4f56a]/[0.06] text-xs text-[#c4f56a]">
                          {index + 1}
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
                    <div className="text-xs font-semibold text-amber-200">
                      Before you compile
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#a8a99b]">
                      {selected.note}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-sm text-[#849087]">
                Select an example to get started.
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101511] p-5 md:p-6">
          <h2 className="font-semibold">Continue learning</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#929d94]">
            This first version is an educational code viewer, not an online
            compiler. Copy an example into a local Leo project and compile it
            with your installed toolchain. For authoritative syntax and
            language updates, consult the official Leo documentation.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://docs.leo-lang.org/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#c4f56a] px-4 py-2.5 text-xs font-bold text-[#10150b] hover:bg-[#d5ff8c]"
            >
              Leo documentation ↗
            </a>
            <a
              href="/docs"
              className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-[#b9c3ba] hover:border-[#c4f56a]/30 hover:text-[#c4f56a]"
            >
              Explore API docs
            </a>
            <a
              href="/explorer"
              className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-[#b9c3ba] hover:border-[#c4f56a]/30 hover:text-[#c4f56a]"
            >
              Open Network Explorer
            </a>
          </div>
        </div>

        <footer className="mt-8 border-t border-white/[0.07] pt-5 text-[11px] text-[#69756c]">
          Leo Lab · Educational examples · Verify code with your Leo toolchain
        </footer>
      </div>
    </main>
  );
}
