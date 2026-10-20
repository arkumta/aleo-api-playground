
import { NextRequest, NextResponse } from "next/server";

function extractText(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

function isSafetyOnlyResponse(content: string): boolean {
  return /^(user\s+)?safety\s*:\s*safe[.!]?\s*$/i.test(
    content.trim()
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is missing from .env.local." },
      { status: 500 }
    );
  }

  let body: {
    code?: unknown;
    compilerOutput?: unknown;
    diagnostics?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const code = typeof body.code === "string" ? body.code : "";
  const compilerOutput =
    typeof body.compilerOutput === "string"
      ? body.compilerOutput
      : "";
  const diagnostics = Array.isArray(body.diagnostics)
    ? JSON.stringify(body.diagnostics, null, 2)
    : typeof body.diagnostics === "string"
      ? body.diagnostics
      : "";

  if (!code.trim()) {
    return NextResponse.json(
      { error: "No Leo code was provided." },
      { status: 400 }
    );
  }

  const prompt = `
You are an expert programming tutor specializing in Aleo Leo.
Your audience includes beginners.

Your job is to explain the actual Leo compiler error and help fix it.
Do not classify the user's safety. Do not return a safety label.

IMPORTANT RULES FOR ACCURACY:
1. Treat the supplied compiler output and diagnostics as the primary evidence.
2. Identify the smallest, simplest code change that addresses the actual error.
3. Explain why the original code failed and why the suggested change should work.
4. Prefer Leo syntax supported by the supplied code, compiler output, or known Leo language rules.
5. Never invent a cast, function, operator, type, or language feature.
6. Never assume a conversion is supported just because it is common in another language.
7. If a fix depends on syntax or behavior you cannot confidently verify, label it "Not compiler-verified" and offer a safer alternative.
8. Do not claim that you compiled, tested, or verified code unless the supplied evidence confirms it.
9. Keep variable types, function parameters, and return types consistent.
10. If multiple errors appear related, explain the underlying error first, then mention likely secondary errors.
11. If the compiler output is missing, say so briefly and explain any assumptions.
12. Do not change unrelated parts of the user's program.
13. Give the simplest useful fix first. Optional alternatives come afterward.
14. Do not say that booleans can be converted to integers unless you have reliable evidence that the specific Leo conversion is supported.

Leo source:
${code.slice(0, 15000)}

Compiler output:
${compilerOutput.slice(0, 10000) || "Not provided"}

Diagnostics:
${diagnostics.slice(0, 10000) || "Not provided"}

Return a clear answer using these exact headings:

## What went wrong
Explain the actual compiler error in beginner-friendly language.

## Why it happened
Explain the relevant Leo type rule or syntax rule.

## How to fix it
Give the simplest fix first. Explain the change. Label uncertain alternatives as "Not compiler-verified".

## Corrected code
Show the corrected relevant code. If the complete program is available above, provide the complete corrected program when practical.

Use Markdown. Include code fences with the leo language label for Leo code.
`;

  try {
    let lastReason = "The model returned no useful explanation.";

    // Retry once because the free router can select different models.
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-OpenRouter-Title": "Aleo Leo Playground",
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: [
              {
                role: "system",
                content: `
You are an expert Aleo Leo programming tutor.
Explain compiler errors directly in useful plain text with Markdown.
Prioritize the smallest reliable fix.
Never invent Leo syntax or claim code was compiled without evidence.
Never respond with a safety classification.
Follow the user's requested headings.
                `.trim(),
              },
              {
                role: "user",
                content:
                  attempt === 0
                    ? prompt
                    : prompt +
                      "\n\nRETRY: Your previous response did not contain a usable explanation. Explain the compiler error directly. Do not return a safety label. Follow all accuracy rules above.",
              },
            ],
            temperature: 0.2,
            max_tokens: 2200,
          }),
          signal: AbortSignal.timeout(60000),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        lastReason =
          typeof data?.error?.message === "string"
            ? data.error.message
            : `OpenRouter returned HTTP ${response.status}.`;

        console.error("OpenRouter API error:", {
          status: response.status,
          message: lastReason,
        });

        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            { error: `OpenRouter authentication error: ${lastReason}` },
            { status: 502 }
          );
        }

        continue;
      }

      const choice = data?.choices?.[0];
      const message = choice?.message;
      const content = extractText(message?.content);
      const reasoning = extractText(message?.reasoning);

      console.log("Leo AI response metadata:", {
        model: data?.model,
        finishReason: choice?.finish_reason,
        contentLength: content.length,
        reasoningLength: reasoning.length,
      });

      if (content && !isSafetyOnlyResponse(content)) {
        return NextResponse.json({ explanation: content });
      }

      lastReason = isSafetyOnlyResponse(content)
        ? "The selected model returned a safety label instead of an explanation."
        : `The model returned no text (finish reason: ${
            choice?.finish_reason ?? "unknown"
          }).`;

      if (!content && reasoning && attempt === 1) {
        console.warn("Model returned reasoning but no answer text.");
      }
    }

    return NextResponse.json(
      {
        error:
          "The free AI model did not provide a usable compiler explanation after two attempts. Please retry.",
        details: lastReason,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Leo AI request failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          (error.name === "TimeoutError" || error.name === "AbortError")
            ? "The AI request timed out. Please try again."
            : "Could not connect to OpenRouter. Check your connection.",
      },
      { status: 502 }
    );
  }
}
