
"use client";

import { useState } from "react";
import JSZip from "jszip";

type DownloadProjectButtonProps = {
  code: string;
};

function getProjectName(code: string) {
  const match = code.match(
    /\bprogram\s+([a-zA-Z][a-zA-Z0-9_]*)(?:\.aleo)?\s*\{/
  );

  const name = match?.[1] ?? "leo_project";

  return name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/^[^a-zA-Z]+/, "") || "leo_project";
}

export default function DownloadProjectButton({
  code,
}: DownloadProjectButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function downloadProject() {
    if (!code.trim()) {
      setError("Add some Leo code before downloading.");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const zip = new JSZip();
      const projectName = getProjectName(code);
      const programName = `${projectName}.aleo`;
      const folder = zip.folder(projectName);

      if (!folder) {
        throw new Error("Could not create the project folder.");
      }

      folder.file("src/main.leo", code);

      folder.file(
        "program.json",
        JSON.stringify(
          {
            program: programName,
            version: "0.1.0",
            description: "Leo Playground project",
            license: "MIT",
            dependencies: null,
            dev_dependencies: null,
          },
          null,
          2
        )
      );

      folder.file(
        "README.md",
        `# ${projectName}

A Leo project exported from Leo Playground.

## Project files

- \`src/main.leo\` — your Leo source code
- \`program.json\` — project metadata

## Build locally

1. Install the Leo CLI using the official instructions:
   https://docs.leo-lang.org/

2. Open a terminal in this project folder.

3. Run:

\`\`\`bash
leo build
\`\`\`

Review any compiler errors before using the program.

This export contains source code and project metadata. It does not
include compiled proving keys, proofs, or deployed transactions.
`
      );

      folder.file(
        ".gitignore",
        "build/\n.env\n.DS_Store\nnode_modules/\n"
      );

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the ZIP file."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={downloadProject}
        disabled={downloading || !code.trim()}
        className="inline-flex items-center gap-2 rounded-lg border border-[#c4f56a]/30 bg-[#c4f56a]/[0.08] px-3 py-2 text-xs font-semibold text-[#c4f56a] transition hover:bg-[#c4f56a]/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">{downloading ? "◌" : "↓"}</span>
        {downloading ? "Preparing ZIP..." : "Download Leo Project"}
      </button>

      {error && (
        <p role="alert" className="max-w-xs text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
