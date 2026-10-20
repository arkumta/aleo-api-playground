
"use client";

import AIErrorExplainer from "./AIErrorExplainer";
import DownloadProjectButton from "./DownloadProjectButton";
import LeoEditor, { type LeoEditorHandle } from "./LeoEditor";
import { useMemo, useRef, useState } from "react";

const EXAMPLES = [
  {
    name: "Add two numbers",
    description: "Add two unsigned integers.",
    code: `program hello_world.aleo {
    @noupgrade
    constructor() {}

    fn main(public a: u32, b: u32) -> u32 {
        let result: u32 = a + b;
        return result;
    }
}`,
  },
  {
    name: "Subtract numbers",
    description: "Subtract one unsigned integer from another.",
    code: `program subtract_numbers.aleo {
    @noupgrade
    constructor() {}

    fn main(public a: u32, b: u32) -> u32 {
        let result: u32 = a - b;
        return result;
    }
}`,
  },
  {
    name: "Multiply numbers",
    description: "Multiply two unsigned integers.",
    code: `program multiply_numbers.aleo {
    @noupgrade
    constructor() {}

    fn main(public a: u32, b: u32) -> u32 {
        let result: u32 = a * b;
        return result;
    }
}`,
  },
  {
    name: "Increment a value",
    description: "Add one to an unsigned integer.",
    code: `program increment_value.aleo {
    @noupgrade
    constructor() {}

    fn main(public value: u32) -> u32 {
        let result: u32 = value + 1u32;
        return result;
    }
}`,
  },
  {
    name: "Compare values",
    description: "Check whether one unsigned integer is greater than another.",
    code: `program compare_values.aleo {
    @noupgrade
    constructor() {}

    fn main(public a: u32, b: u32) -> bool {
        let result: bool = a > b;
        return result;
    }
}`,
  },
  {
    name: "Private input",
    description: "Use a private input in a calculation with a public input.",
    code: `program private_input.aleo {
    @noupgrade
    constructor() {}

    fn main(public multiplier: u32, secret_value: u32) -> u32 {
        let result: u32 = multiplier * secret_value;
        return result;
    }
}`,
  },
  {
    name: "Percentage discount",
    description: "Subtract a percentage-based discount from a value.",
    code: `program percentage_discount.aleo {
    @noupgrade
    constructor() {}

    fn main(public amount: u32, discount_percent: u32) -> u32 {
        let result: u32 = amount - ((amount * discount_percent) / 100u32);
        return result;
    }
}`,
  },
  {
    name: "Struct example",
    description: "Create a struct and return a modified copy of its values.",
    code: `struct Point {
    x: u32,
    y: u32,
}

program point_example.aleo {
    @noupgrade
    constructor() {}

    fn swap_coordinates(point: Point) -> Point {
        return Point {
            x: point.y,
            y: point.x,
        };
    }
}`,
  },
  {
    name: "Private record",
    description: "Define a Token record and return it with a new owner.",
    code: `program token_record.aleo {
    record Token {
        owner: address,
        amount: u64,
    }

    @noupgrade
    constructor() {}

    fn transfer_private(token: Token, receiver: address) -> Token {
        return Token {
            owner: receiver,
            amount: token.amount,
        };
    }
}`,
  },
  {
    name: "Public mapping",
    description: "Store a public balance in an on-chain mapping.",
    code: `program balance_tracker.aleo {
    mapping balances: address => u64;

    @noupgrade
    constructor() {}

    fn set_balance(
        public account: address,
        public amount: u64
    ) -> Final {
        return final {
            Mapping::set(balances, account, amount);
        };
    }
}`,
  },
  {
    name: "DeFi Swap Calculator",
    description:
      "Estimate swap output, trading fee, and minimum output after slippage for a constant-product pool. Educational calculator only; it does not execute a swap.",
    code: `struct SwapQuote {
    amount_out: u64,
    fee_amount: u64,
    min_amount_out: u64,
}

program defi_swap_calculator.aleo {
    @noupgrade
    constructor() {}

    fn main(
        public amount_in: u64,
        public reserve_in: u64,
        public reserve_out: u64,
        public fee_bps: u64,
        public slippage_bps: u64
    ) -> SwapQuote {
        let fee_amount: u64 = (amount_in * fee_bps) / 10000u64;
        let amount_after_fee: u64 = amount_in - fee_amount;
        let amount_out: u64 =
            (amount_after_fee * reserve_out) / (reserve_in + amount_after_fee);
        let min_amount_out: u64 =
            (amount_out * (10000u64 - slippage_bps)) / 10000u64;

        return SwapQuote {
            amount_out: amount_out,
            fee_amount: fee_amount,
            min_amount_out: min_amount_out,
        };
    }
}`,
  },
  {
    name: "Private Eligibility Verification",
    description:
      "Compare a private value against a public threshold and return an eligibility result. Educational example; verify result visibility for your application.",
    code: `program private_eligibility.aleo {
    @noupgrade
    constructor() {}

    fn main(public minimum_score: u32, private_score: u32) -> bool {
        let eligible: bool = private_score >= minimum_score;
        return eligible;
    }
}`,
  },
  {
    name: "NFT Membership / Access Pass",
    description:
      "Model a membership pass as a private record and check whether its tier meets a required access level. Educational example; not a complete NFT standard.",
    code: `program membership_access_pass.aleo {
    record MembershipPass {
        owner: address,
        tier: u8,
    }

    @noupgrade
    constructor() {}

    fn check_access(pass: MembershipPass, public required_tier: u8) -> bool {
        let has_access: bool = pass.tier >= required_tier;
        return has_access;
    }
}`,
  },
  {
    name: "Escrow / Conditional Release",
    description:
      "Model the release condition for an escrow: release is permitted only when both buyer approval and seller delivery are confirmed. Educational logic only; it does not hold or transfer funds.",
    code: `program escrow_release_check.aleo {
    @noupgrade
    constructor() {}

    fn main(
        public buyer_approved: bool,
        public seller_delivered: bool
    ) -> bool {
        let can_release: bool = buyer_approved && seller_delivered;
        return can_release;
    }
}`,
  },
  {
    name: "Staking Rewards Calculator",
    description:
      "Estimate staking rewards from a staked amount, annual reward rate in basis points, and duration in days. Calculator only; it does not stake or transfer tokens.",
    code: `struct StakingEstimate {
    reward_amount: u64,
    total_amount: u64,
}

program staking_rewards_calculator.aleo {
    @noupgrade
    constructor() {}

    fn main(
        public stake_amount: u64,
        public annual_rate_bps: u64,
        public duration_days: u64
    ) -> StakingEstimate {
        let reward_amount: u64 =
            (stake_amount * annual_rate_bps * duration_days) / (10000u64 * 365u64);
        let total_amount: u64 = stake_amount + reward_amount;

        return StakingEstimate {
            reward_amount: reward_amount,
            total_amount: total_amount,
        };
    }
}`,
  },
];

type Diagnostic = {
  line: number;
  column?: number;
  message: string;
};

type CompileResult = {
  ok: boolean;
  output?: string;
  error?: string;
  compiledProgram?: string;
  diagnostics?: Diagnostic[];
};

export default function LeoPlaygroundPage() {
  const editorRef = useRef<LeoEditorHandle>(null);

  const [selectedExample, setSelectedExample] =
    useState(EXAMPLES[0].name);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [network, setNetwork] = useState("testnet");
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);

  const lineCount = useMemo(
    () => code.split("\n").length,
    [code]
  );

  function loadExample(name: string) {
    const example = EXAMPLES.find((item) => item.name === name);
    if (!example) return;

    setSelectedExample(name);
    setCode(example.code);
    setResult(null);
  }

  function resetCode() {
    const example = EXAMPLES.find(
      (item) => item.name === selectedExample
    );

    if (!example) return;

    setCode(example.code);
    setResult(null);
  }

  async function compileCode() {
    setIsCompiling(true);
    setResult(null);

    try {
      const response = await fetch("/api/leo-compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, network }),
      });

      const data = (await response.json()) as CompileResult;
      setResult(data);
    } catch {
      setResult({
        ok: false,
        error:
          "Could not reach the compiler endpoint. Check that your Next.js server is running.",
        diagnostics: [],
      });
    } finally {
      setIsCompiling(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      setResult({
        ok: false,
        error:
          "Clipboard access failed. Select the code in the editor and copy it manually.",
        diagnostics: [],
      });
    }
  }

  function jumpToDiagnostic(diagnostic: Diagnostic) {
    editorRef.current?.focusPosition(
      diagnostic.line,
      diagnostic.column ?? 1
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e0c] text-[#e8eee8]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#c4f56a]">
              <span className="h-2 w-2 rounded-full bg-[#c4f56a]" />
              Aleo Developer Tools
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Leo Playground
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9aa59b]">
              Explore ready-to-use Leo templates, edit code, and compile
              programs with the Leo CLI.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#b7c1b8] hover:text-white"
            >
              API Playground
            </a>

            <a
              href="/leo-lab"
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#b7c1b8] hover:text-white"
            >
              Leo Lab
            </a>
          </div>
        </header>

        <section className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#111612] p-4">
            <p className="text-xs uppercase tracking-wider text-[#849087]">
              Editor
            </p>
            <p className="mt-2 text-lg font-medium">Leo source</p>
            <p className="mt-1 text-sm text-[#849087]">
              Editable code · {lineCount} lines
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111612] p-4">
            <p className="text-xs uppercase tracking-wider text-[#849087]">
              Templates
            </p>
            <p className="mt-2 text-lg font-medium">
              {EXAMPLES.length} examples
            </p>
            <p className="mt-1 text-sm text-[#849087]">
              From basics to on-chain state
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111612] p-4">
            <p className="text-xs uppercase tracking-wider text-[#849087]">
              Network
            </p>

            <select
              aria-label="Network"
              value={network}
              onChange={(event) => setNetwork(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0e0c] px-3 py-2 text-sm text-white outline-none focus:border-[#c4f56a]"
            >
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>

            <p className="mt-1 text-xs text-[#849087]">
              Compilation only; no transaction is submitted.
            </p>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111612]">
            <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">main.leo</span>

                <select
                  aria-label="Load Leo template"
                  value={selectedExample}
                  onChange={(event) => loadExample(event.target.value)}
                  className="max-w-full rounded-lg border border-white/10 bg-[#0b0e0c] px-3 py-2 text-xs text-[#c7d0c8] outline-none focus:border-[#c4f56a]"
                >
                  {EXAMPLES.map((example) => (
                    <option key={example.name} value={example.name}>
                      {example.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyCode}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#c5cec6] hover:bg-white/5"
                >
                  Copy code
                </button>
<DownloadProjectButton code={code} />
                <button
                  onClick={resetCode}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#c5cec6] hover:bg-white/5"
                >
                  Reset template
                </button>

                <button
                  onClick={compileCode}
                  disabled={isCompiling}
                  className="rounded-lg bg-[#c4f56a] px-4 py-2 text-xs font-bold text-[#11160c] hover:bg-[#d2ff80] disabled:cursor-wait disabled:opacity-60"
                >
                  {isCompiling ? "Compiling…" : "Compile Leo"}
                </button>
              </div>
            </div>

            <div className="border-b border-white/10 bg-[#0e130f] px-4 py-3">
              <p className="text-sm font-medium text-[#c4f56a]">
                {EXAMPLES.find(
                  (example) => example.name === selectedExample
                )?.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#9aa59b]">
                {
                  EXAMPLES.find(
                    (example) => example.name === selectedExample
                  )?.description
                }
              </p>
            </div>

            <div className="min-h-[520px] bg-[#0d110e]">
              <LeoEditor
                ref={editorRef}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  setResult(null);
                }}
                errorLines={
                  result && !result.ok
                    ? (result.diagnostics ?? []).map(
                        (diagnostic) => diagnostic.line
                      )
                    : []
                }
              />
            </div>

            <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 text-xs text-[#78847a] sm:flex-row sm:items-center sm:justify-between">
              <span>Choose a template, edit it, and compile.</span>
              <span>{code.length.toLocaleString()} characters</span>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-2xl border border-white/10 bg-[#111612]">
              <div className="border-b border-white/10 px-4 py-3">
                <h2 className="text-sm font-semibold">Compiler output</h2>
                <p className="mt-1 text-xs text-[#849087]">
                  Output from your installed Leo CLI.
                </p>
              </div>

              <div className="min-h-[220px] p-4">
                {!result && !isCompiling && (
                  <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#c4f56a]">
                      &gt;_
                    </div>
                    <p className="text-sm font-medium text-[#c7d0c8]">
                      Ready to compile
                    </p>
                    <p className="mt-2 max-w-xs text-xs leading-5 text-[#849087]">
                      Select a template and click Compile Leo.
                    </p>
                  </div>
                )}

                {isCompiling && (
                  <div className="flex min-h-[180px] items-center justify-center gap-3 text-sm text-[#c4f56a]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c4f56a]/30 border-t-[#c4f56a]" />
                    Running Leo compiler…
                  </div>
                )}

                {result && (
                  <div>
                    <div
                      className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        result.ok
                          ? "bg-[#c4f56a]/10 text-[#c4f56a]"
                          : "bg-red-400/10 text-red-300"
                      }`}
                    >
                      {result.ok
                        ? "Compilation succeeded"
                        : "Compilation failed"}
                    </div>

                    {!result.ok && result.error && (
                      <div className="mb-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3">
                        <p className="text-xs font-semibold text-red-300">
                          What went wrong
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-[#e5c9c9]">
                          {result.error}
                        </p>
                      </div>
                    )}

                    {!result.ok &&
                      (result.diagnostics?.length ?? 0) > 0 && (
                        <div className="mb-4 space-y-2">
                          <h3 className="text-sm font-semibold text-red-300">
                            Issues found
                          </h3>

                          {result.diagnostics!.map((diagnostic, index) => (
                            <button
                              type="button"
                              key={`${diagnostic.line}-${diagnostic.column ?? "unknown"}-${index}`}
                              onClick={() => jumpToDiagnostic(diagnostic)}
                              title="Click to jump to this error in the editor"
                              className="block w-full rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-left transition hover:border-red-400/50 hover:bg-red-400/[0.10] focus:outline-none focus:ring-2 focus:ring-red-400/50"
                            >
                              <p className="text-xs font-semibold text-red-300">
                                <span className="underline decoration-dotted underline-offset-4">
                                  Line {diagnostic.line}
                                  {diagnostic.column
                                    ? `, Column ${diagnostic.column}`
                                    : ""}
                                </span>
                                <span className="ml-2 text-[10px] font-normal text-[#849087]">
                                  Click to jump ↗
                                </span>
                              </p>

                              <p className="mt-1 break-words text-xs leading-5 text-[#c5cec6]">
                                {diagnostic.message}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
{!result.ok && (
  <AIErrorExplainer
    code={code}
    compilerOutput={result.output || result.error || ""}
    diagnostics={result.diagnostics ?? []}
  />
)}
                    <details open={!result.ok} className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-[#9aa59b] hover:text-white">
                        {result.ok
                          ? "View compiler output"
                          : "View full compiler output"}
                      </summary>

                      <pre className="mt-2 max-h-[430px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#090c0a] p-3 font-mono text-xs leading-5 text-[#b8c6b9]">
                        {result.output ||
                          result.error ||
                          "No compiler output was returned."}
                      </pre>
                    </details>

                    {result.compiledProgram && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs font-semibold text-[#c4f56a]">
                          Compiled Aleo instructions
                        </p>
                        <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#090c0a] p-3 font-mono text-xs leading-5 text-[#b8c6b9]">
                          {result.compiledProgram}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#c4f56a]/20 bg-[#c4f56a]/[0.04] p-4">
              <h2 className="text-sm font-semibold text-[#c4f56a]">
                Template library
              </h2>

              <ul className="mt-3 space-y-2 text-xs leading-5 text-[#a9b4aa]">
                <li>• Basic arithmetic and comparisons</li>
                <li>• Public and private function inputs</li>
                <li>• Struct definitions and returned values</li>
                <li>• Private record examples</li>
                <li>• Public mapping and finalization</li>
              </ul>

              <p className="mt-3 border-t border-[#c4f56a]/10 pt-3 text-xs leading-5 text-[#849087]">
                Templates are starting points. Compile them with your local
                Leo CLI before building on them. This playground does not
                submit transactions or deploy programs.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111612] p-4">
              <h2 className="text-sm font-semibold">Official documentation</h2>
              <p className="mt-2 text-sm leading-6 text-[#9aa59b]">
                Learn more about Leo functions, records, structs, and public
                state.
              </p>

              <a
                href="https://docs.leo-lang.org/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#c4f56a] hover:underline"
              >
                Read the Leo guide ↗
              </a>
            </section>
          </aside>
        </div>

        <footer className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-[#657167]">
          Developer preview · Never enter private keys, seed phrases, or
          secrets into code or logs.
        </footer>
      </div>
    </main>
  );
}
