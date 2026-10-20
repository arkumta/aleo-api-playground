
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const MAX_CODE_LENGTH = 20_000;

export const maxDuration = 45;

type Diagnostic = {
  line: number;
  column?: number;
  code?: string;
  message: string;
  help?: string;
};

function cleanOutput(value: string): string {
  return value
    // Remove ANSI terminal colors and formatting.
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    // Remove terminal hyperlinks and other OSC sequences.
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    // Normalize whitespace and line endings.
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function getProgramName(code: string): string | null {
  const match = code.match(
    /\bprogram\s+([a-zA-Z][a-zA-Z0-9_]*)(?:\.aleo)?\s*\{/
  );

  return match ? `${match[1]}.aleo` : null;
}

function extractDiagnostics(output: string): Diagnostic[] {
  const text = cleanOutput(output);
  const lines = text.split("\n");
  const diagnostics: Diagnostic[] = [];
  const seen = new Set<string>();

  // Example:
  // [ETYC0372017] Error: the type `invalid_type` is not found...
  const errorHeader =
    /^\s*\[(?<code>[A-Z]+\d+)\]\s*(?<severity>Error|Warning):\s*(?<message>.*)$/i;

  // Example source location: main.leo:6:9
  const locationPattern = /main\.leo:(\d+):(\d+)/;

  let current: {
    code?: string;
    message: string;
    help?: string;
  } | null = null;

  for (const rawLine of lines) {
    const lineText = rawLine.trim();
    const header = lineText.match(errorHeader);

    if (header?.groups) {
      current = {
        code: header.groups.code,
        message: header.groups.message.trim(),
      };

      // Some Leo versions include the location on the error line.
      const sameLineLocation = lineText.match(locationPattern);

      if (sameLineLocation) {
        addDiagnostic(
          Number(sameLineLocation[1]),
          Number(sameLineLocation[2]),
          current,
          diagnostics,
          seen
        );
        current = null;
      }

      continue;
    }

    // Capture a Help suggestion for the current diagnostic.
    if (current && /^\s*Help:/i.test(lineText)) {
      current.help = lineText.replace(/^\s*Help:\s*/i, "").trim();
      continue;
    }

    const location = lineText.match(locationPattern);

    if (location && current) {
      addDiagnostic(
        Number(location[1]),
        Number(location[2]),
        current,
        diagnostics,
        seen
      );

      current = null;
    }
  }

  // Fallback for Leo versions that format diagnostics differently.
  if (diagnostics.length === 0) {
    for (const lineText of lines) {
      const location = lineText.match(locationPattern);

      if (!location) continue;

      const line = Number(location[1]);
      const column = Number(location[2]);
      const key = `${line}:${column}:fallback`;

      if (seen.has(key)) continue;

      seen.add(key);

      diagnostics.push({
        line,
        column,
        message: "Leo reported a compilation issue at this location.",
      });
    }
  }

  return diagnostics;
}

function addDiagnostic(
  line: number,
  column: number,
  detail: {
    code?: string;
    message: string;
    help?: string;
  },
  diagnostics: Diagnostic[],
  seen: Set<string>
) {
  const key = `${line}:${column}:${detail.code ?? ""}:${detail.message}`;

  if (seen.has(key)) return;

  seen.add(key);

  diagnostics.push({
    line,
    column,
    code: detail.code,
    message:
      detail.message ||
      "Leo reported a compilation issue at this location.",
    help: detail.help,
  });
}

export async function POST(request: Request) {
  let tempDir: string | undefined;

  try {
    const body = await request.json();
    const code =
      typeof body?.code === "string" ? body.code : "";

    if (!code.trim()) {
      return Response.json(
        {
          ok: false,
          error: "Paste some Leo code before compiling.",
          diagnostics: [],
        },
        { status: 400 }
      );
    }

    if (code.length > MAX_CODE_LENGTH) {
      return Response.json(
        {
          ok: false,
          error: "Code is too long. Keep it under 20,000 characters.",
          diagnostics: [],
        },
        { status: 413 }
      );
    }

    const programName = getProgramName(code);

    if (!programName) {
      return Response.json(
        {
          ok: false,
          error:
            "Could not find a program declaration. Check that your code starts with a declaration such as `program hello_world.aleo {`.",
          diagnostics: [],
        },
        { status: 400 }
      );
    }

    tempDir = await mkdtemp(
      path.join(os.tmpdir(), "aleo-leo-playground-")
    );

    const srcDir = path.join(tempDir, "src");
    await mkdir(srcDir, { recursive: true });

    const programSlug = programName.replace(/\.aleo$/, "");

    await writeFile(
      path.join(tempDir, "program.json"),
      JSON.stringify(
        {
          program: programName,
          version: "0.1.0",
          description: "Temporary Leo Playground program",
          license: "MIT",
          dependencies: null,
          dev_dependencies: null,
        },
        null,
        2
      ),
      "utf8"
    );

    await writeFile(
      path.join(srcDir, "main.leo"),
      code,
      "utf8"
    );

    const leoPath = path.join(
      os.homedir(),
      ".cargo",
      "bin",
      "leo"
    );

    let stdout = "";
    let stderr = "";

    try {
      const result = await execFileAsync(
        leoPath,
        ["build"],
        {
          cwd: tempDir,
          timeout: 35_000,
          maxBuffer: 2 * 1024 * 1024,
          env: {
            ...process.env,
            PATH: `${path.join(os.homedir(), ".cargo", "bin")}:${process.env.PATH || ""}`,
            NO_COLOR: "1",
          },
        }
      );

      stdout = result.stdout ?? "";
      stderr = result.stderr ?? "";
    } catch (error: unknown) {
      const commandError = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
        code?: string;
      };

      const rawOutput = [
        commandError.stdout,
        commandError.stderr,
        commandError.message,
      ]
        .filter(Boolean)
        .join("\n");

      if (commandError.code === "ENOENT") {
        return Response.json(
          {
            ok: false,
            error:
              "Leo CLI was not found. Check that Leo is installed at ~/.cargo/bin/leo.",
            diagnostics: [],
          },
          { status: 503 }
        );
      }

      const cleanedOutput = cleanOutput(rawOutput);
      const diagnostics = extractDiagnostics(rawOutput);

      return Response.json(
        {
          ok: false,
          error: diagnostics.length
            ? "Leo could not compile this program. Review the errors below."
            : cleanedOutput || "Leo compiler exited with an error.",
          output: cleanedOutput,
          diagnostics,
        },
        { status: 422 }
      );
    }

    let compiledProgram: string | undefined;

    const outputPaths = [
      path.join(tempDir, "build", programSlug, "program.aleo"),
      path.join(tempDir, "build", programSlug, `${programSlug}.aleo`),
      path.join(tempDir, "build", programName),
    ];

    for (const outputPath of outputPaths) {
      try {
        compiledProgram = await readFile(outputPath, "utf8");
        break;
      } catch {
        // Try the next possible output location.
      }
    }

    return Response.json({
      ok: true,
      output:
        cleanOutput([stdout, stderr].filter(Boolean).join("\n")) ||
        `Leo successfully built ${programName}.`,
      compiledProgram,
      diagnostics: [],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        ok: false,
        error: `Compiler endpoint error: ${message}`,
        diagnostics: [],
      },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      await rm(tempDir, {
        recursive: true,
        force: true,
      }).catch(() => undefined);
    }
  }
}
