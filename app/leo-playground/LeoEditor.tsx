
"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";

export type LeoEditorHandle = {
  focusPosition: (line: number, column?: number) => void;
};

type LeoEditorProps = {
  value: string;
  onChange: (value: string) => void;
  errorLines?: number[];
};

const leoLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.match("//")) {
      stream.skipToEnd();
      return "lineComment";
    }

    if (stream.match(/"(?:[^"\\]|\\.)*"?/)) {
      return "string";
    }

    if (
      stream.match(
        /\b(program|function|fn|const|let|return|if|else|for|in|mapping|struct|record|transition|finalize|async|await|constructor|assert|assert_eq|assert_neq|public|private|as|self)\b/
      )
    ) {
      return "keyword";
    }

    if (
      stream.match(
        /\b(u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|field|bool|address|group|scalar|signature|string)\b/
      )
    ) {
      return "typeName";
    }

    if (stream.match(/\b(true|false)\b/)) {
      return "bool";
    }

    if (stream.match(/\b\d+(\.\d+)?\b/)) {
      return "number";
    }

    if (stream.match(/[A-Za-z_]\w*(?=\s*\()/)) {
      return "function";
    }

    if (stream.match(/[A-Za-z_]\w*/)) {
      return "variableName";
    }

    stream.next();
    return null;
  },
});

function createErrorHighlightExtension(errorLines: number[]) {
  const errorLineSet = new Set(
    errorLines.filter(
      (line) => Number.isInteger(line) && line > 0
    )
  );

  const errorDecoration = Decoration.line({
    attributes: {
      class: "cm-leo-error-line",
      title: "Leo compiler reported an error on this line",
    },
  });

  function buildDecorations(view: EditorView): DecorationSet {
    const ranges = [...errorLineSet]
      .filter((line) => line <= view.state.doc.lines)
      .map((line) =>
        errorDecoration.range(view.state.doc.line(line).from)
      );

    return Decoration.set(ranges, true);
  }

  const errorPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );

  const errorTheme = EditorView.baseTheme({
    ".cm-line.cm-leo-error-line": {
      backgroundColor: "rgba(248, 113, 113, 0.16) !important",
      borderLeft: "3px solid #f87171",
      boxSizing: "border-box",
    },
    ".cm-line.cm-leo-error-line span": {
      textDecoration: "underline wavy #f87171",
      textUnderlineOffset: "3px",
    },
  });

  return [errorPlugin, errorTheme];
}

const LeoEditor = forwardRef<LeoEditorHandle, LeoEditorProps>(
  function LeoEditor({ value, onChange, errorLines = [] }, ref) {
    const editorViewRef = useRef<EditorView | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focusPosition(lineNumber, columnNumber = 1) {
          const view = editorViewRef.current;

          if (!view || !Number.isFinite(lineNumber)) return;

          const safeLine = Math.max(
            1,
            Math.min(
              Math.floor(lineNumber),
              view.state.doc.lines
            )
          );

          const line = view.state.doc.line(safeLine);
          const safeColumn = Math.max(
            1,
            Number.isFinite(columnNumber)
              ? Math.floor(columnNumber)
              : 1
          );

          const position = Math.min(
            line.from + safeColumn - 1,
            line.to
          );

          view.dispatch({
            selection: { anchor: position },
            effects: EditorView.scrollIntoView(position, {
              y: "center",
            }),
          });

          view.focus();
        },
      }),
      []
    );

    const errorLinesKey = errorLines.join(",");

    const errorExtensions = useMemo(
      () => createErrorHighlightExtension(errorLines),
      // Rebuild highlights when the reported line numbers change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [errorLinesKey]
    );

    return (
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={(view) => {
          editorViewRef.current = view;
        }}
        theme={oneDark}
        extensions={[leoLanguage, ...errorExtensions]}
        height="520px"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
        }}
        style={{
          fontSize: "13px",
          backgroundColor: "#0d110e",
        }}
      />
    );
  }
);

LeoEditor.displayName = "LeoEditor";

export default LeoEditor;
